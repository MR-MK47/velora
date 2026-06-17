import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin, corsHeaders, successResponse, errorResponse } from './_shared/supabase';
import { authenticateRequest } from './_shared/auth';
import type { GeminiResponse, GeminiSegment } from './_shared/types';

const ingestSchema = z.object({
  youtube_url: z.string().url().refine((url) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
  }, { message: 'Invalid YouTube URL' }),
  campaign_id: z.string().uuid(),
  mode: z.enum(['simple', 'agentic']),
  clip_style: z.string().default('auto'),
  target_duration: z.string().default('dynamic'),
  user_prompt: z.string().optional(),
});

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function ensureValidResponse(res: any): { statusCode: number; headers: Record<string, string>; body: string } {
  if (!res || typeof res.statusCode !== 'number' || typeof res.body !== 'string') {
    throw new Error(
      `Handler returned invalid response: statusCode=${typeof res?.statusCode}, body=${typeof res?.body}`
    );
  }
  return res;
}

function parseGeminiJson(text: string): GeminiResponse {
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  const attempts: Array<(s: string) => string> = [
    (s) => s,
    (s) => s.replace(/'/g, '"').replace(/,\s*([}\]])/g, '$1'),
    (s) => {
      let escaped = '';
      let inStr = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
          if (inStr) {
            const next = s.slice(i + 1).trimStart()[0];
            if (next === ',' || next === ']' || next === '}' || next === ':') {
              inStr = false;
              escaped += '"';
            } else {
              escaped += '\\"';
            }
          } else {
            inStr = true;
            escaped += '"';
          }
        } else {
          escaped += ch;
        }
      }
      return escaped;
    },
  ];

  for (const transform of attempts) {
    try {
      return JSON.parse(transform(cleaned));
    } catch {
      continue;
    }
  }
  throw new Error('All JSON parse attempts failed');
}

export const handler = async (event: any, _context: any): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> => {
  console.log('[ingest] Handler invoked, httpMethod:', event?.httpMethod || event?.method);
  try {
    const result = await handlerInner(event);
    return ensureValidResponse(result);
  } catch (err) {
    console.error('[ingest] Unhandled error:', err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message, stack }),
    };
  }
};

async function handlerInner(event: any): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const httpMethod = event?.httpMethod || event?.method || '';

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...corsHeaders }, body: '' };
  }

  if (httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const headers = event?.headers || {};
  const userIdOrResponse = await authenticateRequest(headers);
  if (typeof userIdOrResponse !== 'string') {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  let rawBody: string;
  if (typeof event?.body === 'string') {
    rawBody = event.body;
  } else if (event?.body && typeof (event as any).json === 'function') {
    try { rawBody = JSON.stringify(await (event as any).json()); } catch { rawBody = '{}'; }
  } else {
    rawBody = '{}';
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody || '{}');
  } catch (e) {
    console.error('[ingest] JSON parse error:', e);
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message || 'Invalid request', 400);
  }

  const { youtube_url, campaign_id, mode, clip_style, target_duration, user_prompt } = parsed.data;

  const videoId = extractVideoId(youtube_url);
  if (!videoId) {
    return errorResponse('Invalid YouTube URL', 400);
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('id, user_id, title, campaign_brief')
    .eq('id', campaign_id)
    .single();

  if (campaignError || !campaign) {
    return errorResponse('Campaign not found', 404);
  }

  if (campaign.user_id !== userId) {
    return errorResponse('Campaign not found', 404);
  }

  let transcript: string;
  try {
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = transcriptItems.map((item: { text: string }) => item.text).join(' ');
  } catch (e) {
    console.error('[ingest] Transcript fetch error:', e);
    return errorResponse('No transcript available for this video', 400);
  }

  if (!transcript || transcript.trim().length < 20) {
    return errorResponse('No transcript available for this video', 400);
  }

  const campaignBrief = (campaign as Record<string, unknown>).campaign_brief as string | undefined;

  const { data: existingClips } = await supabaseAdmin
    .from('clips')
    .select('edit_state')
    .eq('campaign_id', campaign_id);

  const existingHooks = existingClips?.map((c: Record<string, unknown>) => {
    const state = c.edit_state as Record<string, unknown> | null;
    return state?.hook_title as string | undefined;
  }).filter((h: string | undefined): h is string => !!h) || [];

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  const systemPrompt = `You are a viral clip extraction AI. Extract up to 8 of the most engaging segments from the transcript.

Rules:
- Segments must be 15-60 seconds long
- Hook titles must be clickable and engaging
- Score virality 0-100 based on hook strength, emotional impact, shareability
- MAXIMUM 8 segments. Pick only the very best. No duplicates or near-duplicates.
- Do NOT repeat similar hook titles - each must be unique and distinct
${existingHooks.length > 0 ? `\nExisting hooks to avoid (deduplication):\n${existingHooks.map((h: string) => `- ${h}`).join('\n')}` : ''}
${campaignBrief ? `\nCampaign context:\n${campaignBrief}` : ''}
${clip_style !== 'auto' ? `\nClip style preference: ${clip_style}` : ''}
${target_duration !== 'dynamic' ? `\nTarget duration: ${target_duration}` : ''}
${user_prompt ? `\nUser instructions:\n${user_prompt}` : ''}

IMPORTANT: Return ONLY valid JSON. Double-quote all keys. For hook_title string values, use single quotes or backticks if any internal punctuation is needed. No markdown, no code blocks, no trailing commas, no comments. Keep the response very short.

If no good segments exist, return: {"no_segments":true,"reason":"explanation"}

For segments, return: {"segments":[{"start_ts":0,"end_ts":0,"hook_title":"...","virality_score":0}]}`;

  let segments: GeminiSegment[] = [];
  let noSegments = false;
  let noSegmentsReason = '';
  let lastError: unknown;

  const geminiModels = ['gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

  if (geminiApiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    for (const model of geminiModels) {
      let attempt = 0;
      const maxAttempts = 2;
      while (attempt < maxAttempts) {
        attempt++;
        console.log('[ingest] Gemini attempt', attempt, 'model:', model);
        try {
          const response = await ai.models.generateContent({
            model,
            contents: transcript,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          });

          const text = response.text;
          if (!text) {
            console.warn('[ingest] Empty response from model:', model);
            break;
          }

          let parsedResponse: GeminiResponse;
          try {
            parsedResponse = parseGeminiJson(text);
          } catch (parseErr) {
            console.warn('[ingest] Invalid JSON from model:', model, parseErr);
            break;
          }

          if (parsedResponse.no_segments) {
            noSegments = true;
            noSegmentsReason = parsedResponse.reason || 'No suitable segments found';
          } else if (parsedResponse.segments) {
            segments = parsedResponse.segments;
          } else {
            console.warn('[ingest] Unexpected format from model:', model);
            break;
          }
          console.log('[ingest] Gemini returned, segments:', segments.length, 'noSegments:', noSegments, 'model:', model);
          break;
        } catch (e) {
          lastError = e;
          const errMsg = e instanceof Error ? e.message : String(e);
          const isOverload = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
          console.warn('[ingest] Gemini model', model, 'attempt', attempt, 'failed:', errMsg);
          if (isOverload && attempt < maxAttempts) {
            const delay = attempt * 1000;
            console.log('[ingest] Retrying in', delay, 'ms');
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          break;
        }
      }
      if (segments.length > 0 || noSegments) break;
    }
  }

  if (segments.length === 0 && !noSegments && groqApiKey) {
    console.log('[ingest] Falling back to Groq');
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text();
        throw new Error(`Groq error ${groqResponse.status}: ${errBody}`);
      }

      const groqData = await groqResponse.json();
      const groqText = groqData?.choices?.[0]?.message?.content;
      if (!groqText) {
        throw new Error('Groq returned empty response');
      }

      let parsedResponse: GeminiResponse;
      try {
        parsedResponse = parseGeminiJson(groqText);
      } catch (parseErr) {
        console.error('[ingest] Groq invalid JSON:', groqText);
        throw new Error('Groq returned invalid JSON');
      }

      if (parsedResponse.no_segments) {
        noSegments = true;
        noSegmentsReason = parsedResponse.reason || 'No suitable segments found';
      } else if (parsedResponse.segments) {
        segments = parsedResponse.segments;
      } else {
        throw new Error('Groq returned unexpected format');
      }
      console.log('[ingest] Groq returned, segments:', segments.length, 'noSegments:', noSegments);
    } catch (e) {
      lastError = e;
      console.error('[ingest] Groq fallback error:', e);
    }
  }

  if (segments.length === 0 && !noSegments) {
    console.error('[ingest] All AI providers failed, last error:', lastError);
    const errMsg = lastError instanceof Error ? lastError.message : 'AI processing failed';
    const isOverload = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
    if (isOverload) {
      return errorResponse('AI service is temporarily overloaded. Please try again in a few minutes.', 503);
    }
    return errorResponse(errMsg, 502);
  }

  if (noSegments) {
    return successResponse({ no_segments: true, reason: noSegmentsReason });
  }

  if (segments.length === 0) {
    return successResponse({ no_segments: true, reason: 'No segments extracted from video' });
  }

  const clipIds: string[] = [];

  console.log('[ingest] Step: inserting', segments.length, 'clips into Supabase');
  for (const segment of segments) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('clips')
      .insert({
        campaign_id,
        user_id: userId,
        start_ts: segment.start_ts,
        end_ts: segment.end_ts,
        status: 'queued',
        mode,
        clip_style,
        target_duration,
        user_prompt: user_prompt || null,
        virality_score: segment.virality_score,
        edit_state: {
          source_url: youtube_url,
          video_id: videoId,
          hook_title: segment.hook_title,
        },
      })
      .select('id');

    if (insertError) {
      console.error('[ingest] Clip insert failed:', insertError.message);
      continue;
    }

    if (!inserted || inserted.length === 0) {
      console.error('[ingest] Clip insert returned no rows');
      continue;
    }

    const clipId = inserted[0].id;
    clipIds.push(clipId);

    await supabaseAdmin.from('analytics_events').insert({
      user_id: userId,
      clip_id: clipId,
      event_type: 'clip_generated',
      platform: null,
      value: segment.virality_score,
    });
  }

  console.log('[ingest] Step: clip insert done, clipIds:', clipIds.length);

  if (clipIds.length === 0) {
    return errorResponse('Failed to queue clips', 500);
  }

  return successResponse({ clip_ids: clipIds });
};
