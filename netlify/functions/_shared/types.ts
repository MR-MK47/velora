export interface NetlifyEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
  queryStringParameters: Record<string, string> | null;
  isBase64Encoded: boolean;
}

export interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface IngestRequest {
  youtube_url: string;
  campaign_id: string;
  mode: 'simple' | 'agentic';
  clip_style?: string;
  target_duration?: string;
  user_prompt?: string;
}

export interface IngestResponse {
  clip_ids?: string[];
  no_segments?: boolean;
  reason?: string;
}

export interface GeminiSegment {
  start_ts: number;
  end_ts: number;
  hook_title: string;
  virality_score: number;
}

export interface GeminiResponse {
  segments?: GeminiSegment[];
  no_segments?: boolean;
  reason?: string;
}
