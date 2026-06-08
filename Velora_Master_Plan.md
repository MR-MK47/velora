# Velora — Master Project Brief
> Definitive build reference. Zero budget. Single user.
> Any developer or AI agent reading this should be able to build the complete project.

---

## 1. Project Summary

Velora is a personal AI video pipeline for a single Whop content creator.

**Input:** A YouTube video URL.
**Output:** A cut, captioned, beat-synced, audio-layered vertical clip (9:16) with a
CapCut editing guide, SRT subtitle file, and all assets stored in Google Drive.

**The creator's workflow:**
1. Paste YouTube URL → AI selects viral moments → Colab processes clips
2. Review clips in the browser → edit via chat if needed
3. Approve clips → plan posts in the Content Planner → manually upload to platforms
4. Track performance → analytics improve future decisions

**There is no automated social media posting.** The creator uploads manually.
The Content Planner is a personal scheduling and organization tool — not an uploader.

**Two clip generation modes:**
- **Simple:** AI cuts + silence removes → outputs mp4, SRT, CapCut guide. Manual editing.
- **Agentic:** AI cuts + styles captions + layers three audio tracks (hook SFX, hook music,
  background music) + renders fully polished upload-ready clip.

---

## 2. Constraints (Hard Limits)

- **Zero budget.** Every service is on a permanently free tier.
- **No local machine compute.** Laptop runs a browser only. All processing on Colab.
- **No servers.** Netlify + Supabase + Colab + GitHub (code hosting only, no Actions runners for uploads).
- **No automated social media posting.** Creator uploads manually. Platforms don't penalize API uploads algorithmically but the creator prefers control.
- **Single admin account.** No multi-tenancy.

---

## 3. Complete Tech Stack

### Frontend — Netlify (Free)
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14 App Router | Framework, SSR, all API routes |
| Tailwind CSS | 3.x | Styling, responsive layout |
| Supabase JS | 2.x | Auth, DB queries, Realtime subscriptions |
| Recharts | 2.x | All 8 analytics charts |
| wavesurfer.js | 7.x | Waveform visualization in clip editor timeline |
| react-big-calendar | latest | Content planner calendar view (MIT) |
| Zustand | 4.x | Client-side state management |

### Database / Auth — Supabase Free Tier
- PostgreSQL, Row Level Security, Realtime WebSocket
- 500MB storage (text-only rows — will never approach limit)
- 2 million Realtime messages/month free

### AI — All Free Tiers
| Model | Provider | Free Limit | Task |
|---|---|---|---|
| Gemini 2.5 Flash-Lite | Google AI Studio | 1,000 req/day | Hook selection, campaign brief, CapCut guide |
| Llama 3.3 70B | Groq | 1,000 req/day | Director, Caption, Code, Chat edit agents |
| Whisper Large v3 | Groq | 2,000 req/day, 7,200 sec/hr | Audio transcription |
| LiteLLM | Open source | Free | Model-agnostic routing + fallback chain |

### Processing — Google Colab (Free T4 GPU)
| Library | Purpose |
|---|---|
| supabase-py | Realtime listener + all Supabase mutations |
| yt-dlp | Segment-only video download (no full video) |
| ffmpeg | Silence removal, 9:16 render, audio mixing |
| moviepy | AI-generated edit script execution |
| librosa | Beat detection on all audio files |
| Google Drive API | All asset uploads (writes to user-shared folder) |
| Google Docs API | CapCut editing guide as Google Doc |
| Freesound API | Hook SFX, hook music, background music search |
| video-use helpers | render.py patterns, EDL schema, 30ms audio fade |

### File Storage — Google Drive (15GB Free Personal)
Everything non-text goes here. Supabase never stores files.
The Service Account writes to a folder the user shares with it.
Files count against the user's personal 15GB quota.

### Code Hosting — GitHub (Free)
Repository only. No Actions runners. No automated workflows.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR BROWSER  (laptop — lightweight only)                       │
│  Next.js app served from Netlify                                 │
│  ├── All UI pages and components                                 │
│  ├── Supabase Realtime subscription (live clip status updates)   │
│  └── API calls to Next.js serverless functions                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS + WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│  SUPABASE                                                        │
│  ├── PostgreSQL: all tables                                      │
│  ├── Auth: email/password, session, RLS policies                 │
│  └── Realtime: broadcasts INSERT/UPDATE on clips table           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ WebSocket (Colab connects OUT — no Ngrok)
┌─────────────────────▼───────────────────────────────────────────┐
│  GOOGLE COLAB  (T4 GPU, keep browser tab open)                   │
│  ├── Realtime listener: wakes on QUEUED clip INSERT              │
│  ├── Pipeline: yt-dlp → Whisper → ffmpeg → agents → render      │
│  ├── Updates Supabase current_step after every step              │
│  └── Uploads all assets to Google Drive                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Drive API
┌─────────────────────▼───────────────────────────────────────────┐
│  GOOGLE DRIVE  (personal 15GB, SA writes to shared folder)       │
│  └── All files: mp4, SRT, audio, docs, beat maps, chat history  │
└─────────────────────────────────────────────────────────────────┘

DATA FLOW PER CLIP:
Browser → /api/ingest → Gemini selects hooks → INSERT QUEUED rows → Supabase
Supabase Realtime → Colab wakes → processes clip
Colab → UPDATE current_step per step → Supabase → Realtime → browser card updates live
Colab → Drive upload → UPDATE status=DONE + drive URLs → Supabase → browser card shows link
```

---

## 5. Database Schema

### `users`
```sql
id            uuid        PRIMARY KEY  -- Supabase Auth UID
email         text        NOT NULL
role          text        NOT NULL DEFAULT 'guest'  -- 'guest' | 'admin'
created_at    timestamptz DEFAULT now()
```

### `settings` (one row per user, upserted on save)
```sql
user_id                    uuid        PRIMARY KEY REFERENCES users(id)
gemini_key                 text        -- encrypted at rest by Supabase
groq_key                   text
freesound_key              text
drive_service_account_json text        -- full SA JSON as text, ~2KB
drive_root_folder_id       text        -- folder ID of user's shared Velora folder
litellm_config             jsonb       -- provider chain + per-task assignments
default_clip_style         text        DEFAULT 'auto'
default_duration           text        DEFAULT 'dynamic'
default_export_preset      text        DEFAULT 'tiktok'
updated_at                 timestamptz DEFAULT now()
```

### `campaigns`
```sql
id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid()
user_id                  uuid        NOT NULL REFERENCES users(id)
title                    text        NOT NULL
whop_url                 text        -- optional, reference label only, never fetched
cover_photo_drive_url    text        -- public Drive URL
campaign_instructions    text        -- user-pasted rules, audience, guidelines
campaign_brief           text        -- Gemini-compressed 200-word summary
brief_status             text        DEFAULT 'PENDING'  -- PENDING|READY|FAILED
drive_folder_url         text
created_at               timestamptz DEFAULT now()
updated_at               timestamptz DEFAULT now()
```

### `clips`
```sql
id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id         uuid        NOT NULL REFERENCES campaigns(id)
status              text        NOT NULL DEFAULT 'QUEUED'
    -- QUEUED|PROCESSING|DONE|FAILED|REJECTED|SUPERSEDED
current_step        text        -- live label from Colab, shown on card
mode                text        NOT NULL  -- 'simple' | 'agentic'
clip_style          text        DEFAULT 'auto'
    -- auto|hook_first|value_bomb|story_arc|controversy|proof|tutorial
target_duration     text        DEFAULT 'dynamic'  -- 30|45|60|90|dynamic
user_prompt         text        -- optional override, null if not provided
edit_state          jsonb       NOT NULL  -- full Edit State JSON
drive_folder_url    text
manually_uploaded   boolean     DEFAULT false
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

### `content_schedule`
```sql
id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid()
clip_id               uuid        NOT NULL REFERENCES clips(id)
platforms             text[]      -- ['tiktok','youtube','instagram','x','facebook']
target_date           date        NOT NULL
target_time           time
status                text        DEFAULT 'BACKLOG'
    -- BACKLOG|PLANNED|READY|UPLOADED
caption               text        -- AI-generated, user-editable
hashtags              text[]      -- ['whop','reselling','shorts']
notes                 text        -- personal notes for this post
drive_assets_ready    boolean     DEFAULT false  -- user manually toggles
series_id             uuid        REFERENCES content_series(id)  -- nullable
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

### `content_series`
```sql
id              uuid    PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid    NOT NULL REFERENCES users(id)
name            text    NOT NULL  -- e.g. "Cold Outreach Tips Series"
description     text
cadence         text    -- 'daily'|'every_2_days'|'weekly'
platforms       text[]
created_at      timestamptz DEFAULT now()
```

### `analytics_events`
```sql
id           uuid        PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid        NOT NULL REFERENCES users(id)
event_type   text        NOT NULL
    -- clip_generated|clip_uploaded|clip_rejected|clip_deleted
    -- post_planned|post_marked_uploaded|post_cancelled
clip_id      uuid        REFERENCES clips(id)  -- nullable
platform     text        -- nullable, for platform-specific events
created_at   timestamptz DEFAULT now()
```
Every meaningful user action writes one row. All analytics queries run against this.

### RLS Policy (applied to every table)
```sql
-- Applied to ALL tables. One policy covers all operations.
CREATE POLICY "admin_only" ON [table_name]
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
```

---

## 6. Edit State JSON (The Core Contract)

Stored as `clips.edit_state` (jsonb column).
Every agent, every API route, and the Colab worker reads and writes this structure.
This is the single source of truth for a clip's complete edit history.

```json
{
  "clip_id": "uuid",
  "campaign_id": "uuid",
  "version": 1,
  "mode": "agentic",
  "clip_style": "hook_first",
  "target_duration": "60",
  "user_prompt": "focus on the cold outreach section",

  "source": {
    "youtube_url": "https://youtube.com/watch?v=...",
    "channel_name": "Creator Name",
    "start_time": 45.2,
    "end_time": 107.8,
    "virality_score": 87,
    "virality_reason": "Strong open loop, controversy at 1:12",
    "hook_title": "The secret they never tell you"
  },

  "campaign_brief": "Embedded brief copy — always passed to every agent call",

  "transcript": [
    { "word": "Hey", "start": 45.2, "end": 45.5, "confidence": 0.99 },
    { "word": "listen", "start": 45.6, "end": 45.9, "confidence": 0.97 }
  ],

  "edits": {
    "cuts": [
      { "id": "cut_001", "start": 45.2, "end": 50.1, "type": "silence_removed" },
      { "id": "cut_002", "start": 78.3, "end": 79.0, "type": "user_removed", "reason": "cough" }
    ],
    "captions": {
      "style_preset": "bold_center",
      "font": "Montserrat-ExtraBold",
      "animation": "word_pop",
      "color_primary": "#FFD700",
      "color_secondary": "#FFFFFF",
      "position": "center",
      "emphasized_words": ["never", "secret", "only"],
      "custom_overrides": []
    },
    "audio": {
      "hook_sfx": {
        "freesound_id": "334896",
        "title": "Snap_Attention_Whoosh",
        "trigger_time": 0.0,
        "volume": 0.85,
        "drive_url": "https://drive.google.com/...",
        "bpm": null,
        "beat_timestamps": []
      },
      "hook_music": {
        "freesound_id": "123456",
        "title": "Dramatic_Rise_Loop",
        "trigger_time": 0.0,
        "volume": 0.40,
        "drive_url": "https://drive.google.com/...",
        "bpm": 128,
        "beat_timestamps": [0.5, 0.97, 1.44, 1.91]
      },
      "background_music": {
        "freesound_id": "789012",
        "title": "Lo_Fi_Chill_Underscore",
        "trigger_time": 1.5,
        "volume": 0.12,
        "drive_url": "https://drive.google.com/...",
        "bpm": 90,
        "beat_timestamps": [0.67, 1.34, 2.01, 2.68]
      },
      "sfx": [
        {
          "id": "sfx_001",
          "freesound_id": "555111",
          "label": "whoosh_cut",
          "trigger_time": 48.3,
          "volume": 0.60,
          "drive_url": "https://drive.google.com/..."
        }
      ]
    },
    "effects": [
      { "type": "zoom_punch", "at_time": 45.2, "intensity": 1.15 },
      { "type": "cut_flash", "at_time": 67.8 }
    ],
    "export": {
      "resolution": "1080x1920",
      "preset": "tiktok",
      "fps": 30,
      "render_duration_seconds": 60
    }
  },

  "agent_plan": {
    "director_notes": "Sharp hook SFX at 0s. Music drop at 0.5s. Cut hard on every silence. Emphasis on 'never' and 'secret'.",
    "hook_sfx_vibe": "sharp snap or whoosh — attention grab",
    "hook_music_vibe": "energetic trap build — short loop",
    "background_music_vibe": "lofi chill underscore — stays under speech",
    "sfx_moments": [
      { "at_time": 48.3, "type": "whoosh_cut", "reason": "hard cut moment" }
    ],
    "edl": [],
    "model_used": "groq/llama-3.3-70b-versatile",
    "created_at": "2026-05-01T10:00:00Z"
  },

  "chat_history": [
    { "role": "user", "content": "Remove the cough at 1:23", "timestamp": "..." },
    { "role": "assistant", "content": "Removed 01:21–01:25. Re-queued for preview render.", "timestamp": "..." }
  ],

  "models_used": {
    "hook_selection": "gemini/gemini-2.5-flash-lite",
    "director": "groq/llama-3.3-70b-versatile",
    "caption_agent": "groq/llama-3.3-70b-versatile",
    "code_agent": "groq/llama-3.3-70b-versatile",
    "chat_edit": "groq/llama-3.3-70b-versatile"
  },

  "outputs": {
    "proxy_preview_url": "...",
    "final_mp4_drive": "https://drive.google.com/...",
    "srt_drive": "https://drive.google.com/...",
    "editing_guide_doc_drive": "https://drive.google.com/...",
    "chat_history_drive": "https://drive.google.com/..."
  },

  "error": null
}
```

### The Three Audio Layers (Agentic Mode)

Every agentic clip has three distinct audio layers mixed by ffmpeg:

| Layer | When It Plays | Volume | Purpose |
|---|---|---|---|
| **Hook SFX** | 0.0s to ~0.5s | 0.80-0.90 | Sharp attention-grabbing sound (snap, whoosh, camera click). Stops the scroll. Plays before any speech. |
| **Hook Music** | 0.0s onwards | 0.35-0.45 | Short energetic musical loop that establishes mood. Establishes energy in the first 3 seconds. |
| **Background Music** | ~1.5s onwards, fades in | 0.10-0.15 | Ambient/lofi underscore. Sits below speech at all times. Beat-synced to cuts. |

Speech audio from the original video is preserved at 1.0 volume.
All three layers are mixed additively in ffmpeg, never replacing speech.

---

## 7. Colab Worker — Complete Pipeline

### File Structure
```
velora-worker/
├── velora_worker.ipynb       ← Run this in Colab (3 cells: install, connect, listen)
├── config.py                 ← LiteLLM init, key loading from Supabase
├── listener.py               ← Supabase Realtime WebSocket listener
├── downloader.py             ← yt-dlp segment-only download
├── transcriber.py            ← Groq Whisper + WhisperX fallback
├── simple_pipeline.py        ← Simple mode orchestrator
├── agentic_pipeline.py       ← Agentic mode orchestrator
├── director.py               ← Director Agent (Groq) — produces EDL
├── caption_agent.py          ← Caption Agent (Groq) — per-word style overrides
├── audio_agent.py            ← All 3 audio layer selection (hook_sfx + hook + bg)
├── code_agent.py             ← moviepy script generation + execution (Groq)
├── renderer.py               ← ffmpeg final render, audio mixing
├── self_eval.py              ← filmstrip extraction + Gemini quality check
├── drive_client.py           ← Drive API wrapper (root folder ID from settings)
├── caption_styles/
│   ├── bold_center.json
│   ├── word_pop_yellow.json
│   ├── subtitle_lower.json
│   ├── karaoke_highlight.json
│   ├── minimal_white.json
│   └── loud_stack.json
└── prompts/
    ├── director_prompt.txt
    ├── caption_prompt.txt
    ├── code_agent_prompt.txt
    └── hook_selection_prompt.txt
```

### Realtime Listener (listener.py)
```python
def handle_new_clip(payload):
    clip_id = payload['new']['id']
    mode    = payload['new']['mode']
    if mode == 'simple':
        run_simple_pipeline(clip_id)
    elif mode == 'agentic':
        run_agentic_pipeline(clip_id)

supabase.realtime
    .channel('public:clips')
    .on('postgres_changes',
        event='INSERT', schema='public', table='clips',
        filter='status=eq.QUEUED',
        callback=handle_new_clip)
    .subscribe()
print("Velora worker ready. Waiting for clips...")
# Blocks indefinitely. Keep Colab tab open.
```

### Simple Pipeline (step-by-step)
```
1.  UPDATE current_step = 'Downloading segment'
2.  yt-dlp: --download-sections "*{start_time}-{end_time}" → /content/segment.mp4
3.  UPDATE current_step = 'Transcribing'
4.  Groq Whisper Large v3: → word-level timestamps → stored in edit_state.transcript
    (Fallback if quota hit: WhisperX on Colab GPU locally)
5.  UPDATE current_step = 'Cutting silences'
6.  ffmpeg silencedetect: find gaps > 0.5s → build cut list
    Apply 30ms audio fade at every cut boundary (no audio pops)
    Render to 1080×1920, enforce target_duration hard cap → /content/clip_cut.mp4
7.  Generate .srt: group word timestamps into 2-3 word subtitle chunks
8.  UPDATE current_step = 'Generating CapCut guide'
9.  Gemini Flash-Lite: transcript + campaign_brief + virality_reason → CapCut editing guide
10. Google Docs API: save guide as Google Doc
11. UPDATE current_step = 'Uploading to Drive'
12. Drive: create /Velora/{campaign_title}/{clip_id}/v1/ folder
    Upload: clip_final.mp4, clip.srt, editing_guide (Google Doc)
    Make folder publicly viewable (anyone with link)
13. UPDATE status=DONE, current_step='Complete', drive_folder_url, edit_state.outputs
14. Write analytics_events row: event_type='clip_generated'
```

### Agentic Pipeline (all Simple steps through silence cut, then replaces step 8 onward)
```
7.  (same — generate .srt from word timestamps)
8.  UPDATE current_step = 'Director planning edit'
9.  Groq Director Agent call:
    Input:  transcript + campaign_brief + clip_style + user_prompt + target_duration
    Prompt: (from prompts/director_prompt.txt)
    Output: EDL JSON {
      caption_style, hook_sfx_vibe, hook_music_vibe, background_music_vibe,
      sfx_moments: [{at_time, type}], emphasized_words: [], color_grade,
      render_duration_seconds
    }
    Store in edit_state.agent_plan

10. UPDATE current_step = 'Selecting audio'
11. Audio Agent — three parallel searches (sequential in code):

    A. HOOK SFX:
       - Search: hook_sfx_vibe (e.g. "sharp snap attention grab short")
       - Duration filter: 0.1–2.0 seconds
       - librosa: confirm it has a sharp onset (not a fade-in)
       - Store in edit_state.audio.hook_sfx

    B. HOOK MUSIC:
       - Check Drive _sound_library/hook/ for vibe match (Groq picks from meta.json briefs)
       - If no match: Freesound top 5 → librosa all 5 → Groq picks best → all 5 saved to library
       - Store beat_timestamps in edit_state.audio.hook_music

    C. BACKGROUND MUSIC:
       - Same library check flow for _sound_library/background/
       - Store beat_timestamps in edit_state.audio.background_music

    All three files uploaded to Drive folder on completion.

12. UPDATE current_step = 'Styling captions'
13. Groq Caption Agent:
    Input: transcript + emphasized_words from EDL
    Output: per-word style overrides (which words are large/colored/animated)
    Store in edit_state.edits.captions

14. UPDATE current_step = 'Generating edit code'
15. Groq Code Agent:
    System: "You are a Python video editing expert. Output ONLY executable Python.
             Use moviepy. Never produce code longer than needed."
    Input:  silence-cut video path + caption data + all three audio paths + beat timestamps + color_grade + render_duration_seconds
    Output: complete Python script → saved to /content/edit_script.py
    Execute: subprocess.run(['python', '/content/edit_script.py'])
    The script must:
      - Load clip_cut.mp4
      - Add styled captions per word (using caption_styles JSON)
      - Mix three audio layers at specified volumes and trigger times
      - Align cuts to nearest beat_timestamp in background_music
      - Apply hook_sfx at trigger_time=0.0
      - Apply color grade via ffmpeg subprocess
      - Hard-cut output to render_duration_seconds
      - Export to /content/clip_final.mp4 at 1080×1920 30fps

16. UPDATE current_step = 'Rendering' (2–5 minutes on T4 GPU)

17. Self-evaluation:
    - ffmpeg: extract filmstrip PNG (one frame every 2 seconds)
    - Gemini Flash-Lite: "Check this video filmstrip: captions visible?
      No black frames? Correct 9:16? Duration approximately {n}s?"
    - If issues found: regenerate edit code with error as feedback (max 2 retries)
    - If 3rd retry fails: deliver Simple Mode output, set flag in edit_state

18. UPDATE current_step = 'Generating CapCut guide'
    (same Gemini call as Simple Mode)

19. UPDATE current_step = 'Uploading to Drive'
    Drive: /Velora/{campaign_title}/{clip_id}/v1/
    Upload: clip_proxy.mp4 (360p), clip_final.mp4, clip.srt,
            editing_guide (Google Doc), hook_sfx.mp3,
            hook_music.mp3, background_music.mp3,
            beat_map.json (all beat timestamps, never reprocessed),
            chat_history.json (starts empty)

20. UPDATE status=DONE, all drive URLs in edit_state.outputs
21. Write analytics_events: event_type='clip_generated'
```

### Sound Library Logic (audio_agent.py)
```python
def select_audio(vibe, audio_type):
    # audio_type: 'hook_sfx' | 'hook' | 'background'
    library = read_all_meta_from_drive(f'_sound_library/{audio_type}/')
    
    if library:
        # Ask Groq to pick best match from existing library
        best = groq_select_best_match(library_metas=library, vibe=vibe)
        if best:
            return download_from_drive(best['drive_url'])
    
    # Nothing in library or no match — fetch from Freesound
    results = freesound_search(query=vibe, duration_range=(0.1, 2.0) if audio_type == 'hook_sfx' else (5, 30), limit=5)
    
    new_entries = []
    for result in results:
        audio_file = download_freesound_preview(result)
        bpm, beat_timestamps = librosa_analyze(audio_file)
        brief = groq_generate_audio_brief(
            title=result['name'], tags=result['tags'], bpm=bpm
        )
        meta = {
            'freesound_id': result['id'],
            'title': result['name'],
            'tags': result['tags'],
            'bpm': bpm,
            'beat_timestamps': beat_timestamps,
            'ai_brief': brief,
            'duration_seconds': result['duration'],
            'license': result['license'],
            'date_added': datetime.now().isoformat()
        }
        drive_url = upload_to_sound_library(audio_file, meta, audio_type)
        meta['drive_url'] = drive_url
        new_entries.append(meta)
    
    best = groq_select_best_match(library_metas=new_entries, vibe=vibe)
    return download_from_drive(best['drive_url']), best

# After ~20 clips, the library has 60+ analyzed tracks.
# Most future clips never need a Freesound API call.
```

### Drive Folder Structure
```
Velora/                                    ← Root (shared with SA, user's personal Drive)
├── _campaign_assets/
│   └── {campaign_id}/
│       └── cover.jpg
├── _sound_library/
│   ├── hook_sfx/
│   │   ├── {freesound_id}.mp3
│   │   └── {freesound_id}_meta.json     ← {title, tags, bpm, beat_timestamps, ai_brief, duration, license, drive_url}
│   ├── hook/
│   │   ├── {freesound_id}.mp3
│   │   └── {freesound_id}_meta.json
│   └── background/
│       ├── {freesound_id}.mp3
│       └── {freesound_id}_meta.json
└── {campaign_title}/
    └── {clip_id}/
        ├── v1/
        │   ├── clip_proxy.mp4            ← 360p fast preview
        │   ├── clip_final.mp4            ← 1080×1920 full render
        │   ├── clip.srt
        │   ├── editing_guide             ← Google Doc (link in edit_state)
        │   ├── hook_sfx.mp3
        │   ├── hook_music.mp3
        │   ├── background_music.mp3
        │   ├── beat_map.json             ← all beat_timestamps, never reprocessed
        │   └── chat_history.json         ← appended after every chat message
        └── v2/ ...                       ← created on Export Final after edits
```

---

## 8. All API Routes (Next.js Serverless Functions)

### Clip Generation
**POST /api/ingest**
Body: `{ youtube_url, campaign_id, mode, clip_style, target_duration, user_prompt }`
1. Validate YouTube URL format
2. Fetch transcript via youtube-transcript npm (no auth, no API key needed)
3. Load campaign_brief from campaigns table
4. Load all existing clips from this video+campaign (timestamps + hook_titles) for dedup context
5. Call Gemini Flash-Lite with full prompt (transcript + brief + existing clips + style + duration + user_prompt)
   - If no_segments returned: return `{ no_segments: true, reason: "..." }` — no rows inserted
   - If segments returned: parse JSON array
6. INSERT one clips row per segment with status=QUEUED, full edit_state initialized
7. Write analytics_events rows for each: event_type='clip_generated'
8. Return `{ clip_ids: [...] }`

**POST /api/generate-brief**
Body: `{ campaign_id }`
1. Read campaign_instructions from campaigns
2. Gemini Flash-Lite: compress to structured 200-word brief
3. UPDATE campaigns: campaign_brief, brief_status=READY
4. Return `{ brief }`

**POST /api/upload-cover**
Body: multipart form, image file + campaign_id
1. Upload to Drive: /Velora/_campaign_assets/{campaign_id}/cover.jpg
2. Make publicly viewable
3. UPDATE campaigns: cover_photo_drive_url
4. Return `{ url }`

### Clip Editing
**POST /api/edit-chat**
Body: `{ clip_id, message }`
1. Load full edit_state from clips row
2. Append user message to edit_state.chat_history with timestamp
3. Build Groq prompt: full transcript + current edit_state + full chat_history + new message
4. Call Groq Llama 3.3 70B
5. Parse response: extract edit_state diff as structured JSON
6. Apply diff to edit_state (cuts, caption changes, music swaps, etc.)
7. Append assistant response to chat_history
8. UPDATE clips: edit_state (updated), updated_at
9. Upload updated chat_history.json to Drive (overwrite)
10. Return `{ response, edit_state_diff }`

**POST /api/render-preview**
Body: `{ clip_id }`
1. UPDATE clips: current_step='Preview queued'
2. This UPDATE triggers Supabase Realtime → Colab picks it up
   Colab detects a DONE clip with current_step='Preview queued' → runs proxy render
3. Return `{ queued: true }`

### Clip Management
**POST /api/reject-clip** — UPDATE status=REJECTED + write analytics_events
**POST /api/restore-clip** — UPDATE status=DONE
**POST /api/delete-clip** — Delete Drive folder recursively + DELETE clips row + write analytics_events
**POST /api/delete-campaign** — Delete all clip Drive folders + all clips rows + campaign Drive folder + campaign row

### Content Planning
**POST /api/schedule-post**
Body: `{ clip_id, platforms, target_date, target_time, caption, hashtags, notes }`
1. INSERT content_schedule row with status=PLANNED
2. Write analytics_events: event_type='post_planned'
3. Return `{ schedule_id }`

**POST /api/generate-caption**
Body: `{ clip_id, platforms }`
1. Load hook_title + campaign_brief + virality_reason from clip's edit_state
2. Groq: generate platform-optimized caption (respects platform character limits) + hashtags
3. Return `{ caption, hashtags }`

**PUT /api/update-schedule**
Body: `{ schedule_id, ...updatable_fields }`
UPDATE content_schedule row

**POST /api/mark-uploaded**
Body: `{ schedule_id }`
UPDATE content_schedule status=UPLOADED + UPDATE clips manually_uploaded=true + write analytics_events: post_marked_uploaded

**DELETE /api/cancel-schedule** — UPDATE status=CANCELLED

### Settings
**POST /api/save-settings** — UPSERT settings row (all fields)
**POST /api/test-connection** — Body: `{ provider, key }` → make minimal test API call → return `{ ok: true/false, error? }`

### OAuth — Not implemented (no automated posting)

---

## 9. Content Planner — Feature Design

The Content Planner is a personal organization tool for planning and tracking
manual uploads. No OAuth. No automated posting. Creator uploads manually.

### Core Features

**1. Content Calendar**
Calendar view (react-big-calendar) in month/week/day modes.
Events are color-coded by platform.
Dragging events reschedules them (updates target_date + target_time).
Clicking an empty time slot opens the Add to Planner modal.
Clicking an event opens its quick-view panel.

**2. Upload Queue**
Chronological list of all PLANNED and READY posts.
Shows: thumbnail | platform icons | hook title | target date/time | status | [Copy Assets] [Mark Uploaded] [Edit] [Cancel]
Grouped by date. Today's posts highlighted.

**3. Backlog**
All clips with status=DONE that have no entry in content_schedule.
Grid view sorted by virality score descending.
"Add to Planner" button on each clip.
This is where approved clips wait to be scheduled.

**4. Copy Assets Button**
On every scheduled post, one click copies to clipboard:
```
Caption: [the generated caption]
Hashtags: [#whop #reselling #shorts]
Drive Link: [https://drive.google.com/...]
```
User pastes this directly into TikTok/Instagram/YouTube Studio upload form.

**5. AI Caption + Hashtag Generation**
When adding a clip to the planner, Groq generates a caption per selected platform
(TikTok captions are casual + hashtag-heavy; YouTube descriptions are longer;
X captions are concise). User edits before saving.
Platform limits enforced: TikTok 2,200 chars, X 280 chars, LinkedIn 3,000 chars.

**6. Weekly Upload Target**
Set a weekly goal (e.g., "7 uploads/week") in Settings.
Shown as a progress ring on the Schedule page header.
e.g., "4 / 7 uploads this week" with color fill.
Streak counter shows consecutive days with ≥1 upload.

**7. Upload Readiness Checklist**
On each scheduled post, a small checklist:
- [ ] Caption written
- [ ] Hashtags added
- [ ] Drive assets downloaded
- [ ] Platform account ready
Status changes to READY only when all are checked.
Posts with status=READY are visually highlighted in the queue.

**8. In-App Upload Reminders**
When target_time arrives and the browser tab is open: a toast notification appears.
"Time to upload: [Hook Title] → [platforms]. [Open Drive ↗]"
If the browser tab is not open: no notification (no push notification infrastructure).

**9. Content Series**
Group related clips (from same source video, same topic) into a named series.
Set a posting cadence: daily / every 2 days / weekly.
"Auto-fill schedule" button: takes all clips in series and spaces them out at the
cadence, starting from a chosen date. Fills all slots in one click.

**10. Platform Filter**
On both Calendar and Queue views: filter by platform (show only TikTok posts, etc.)

**11. Batch Scheduling**
Select multiple clips from Backlog → assign platforms + start date + cadence.
System auto-fills target_date for each clip based on cadence.
One-click to schedule 10 clips spread over 2 weeks.

**12. Best Time Suggestions**
Static suggestions based on general social media research, shown as hints in the
time picker. "TikTok: 7-9am, 12-3pm, 7-9pm tend to perform well."
(No dynamic analysis — insufficient data at start. Analytics will surface patterns later.)

**13. Repost Planning**
On any UPLOADED post, "Plan Repost" button: creates a new content_schedule row
for the same clip_id with a future date. Useful for reposting a clip on a different
platform 30 days later.

---

## 10. Analytics — Fully Planned

### Dashboard Page Analytics Section

```
FULL WIDTH ROW — Quick Stats Bar:
┌─────────────────────────────────────────────────────────────────────────┐
│  🔥 14d streak  │  Generated: 87  │  Uploaded: 52  │  60% approval  │  78 avg score
└─────────────────────────────────────────────────────────────────────────┘

TWO CHARTS SIDE BY SIDE:
┌─────────────────────────────────────────┐  ┌──────────────────────────────┐
│  Recharts AreaChart                     │  │  Recharts PieChart           │
│  "Clips Generated vs Uploaded"          │  │  "Clip Status Breakdown"     │
│  X-axis: last 30 days (dates)           │  │  Segments:                   │
│  Y-axis: clip count                     │  │  - Uploaded (green)          │
│  Area 1 (blue): clips generated per day │  │  - Pending (blue)            │
│  Area 2 (green): clips uploaded per day │  │  - Rejected (red)            │
│  Tooltip on hover: exact counts         │  │  - Failed (grey)             │
│  60% width                              │  │  Count labels inside each    │
│                                         │  │  segment                     │
│                                         │  │  40% width                   │
└─────────────────────────────────────────┘  └──────────────────────────────┘

[View full analytics →] — right-aligned link

[Recent Campaigns section]
```

### Analytics Page (`/analytics`) — Full Layout

```
HEADER:  "Analytics"          [7d] [30d] [90d] [All time]  ← filters all widgets

ROW 1 — QUICK STATS BAR (6 pills, full width):
Generated | Uploaded | Approval % | Avg Virality Score | Current Streak | Best Platform

ROW 2 — TWO LARGE CHARTS:
┌──────────────────────────────────────────┐  ┌─────────────────────────────────┐
│  Recharts AreaChart                      │  │  Recharts LineChart             │
│  "Generated vs Uploaded over Time"       │  │  "Virality Score Trend"         │
│  Same as dashboard but larger            │  │  X-axis: weeks                  │
│  Shows growth pattern clearly            │  │  Y-axis: avg score 0–100        │
│  60% width                               │  │  Single line, dot per week      │
│                                          │  │  Shows quality improving over   │
│                                          │  │  time. If flat or declining,    │
│                                          │  │  try different clip styles.     │
│                                          │  │  40% width                      │
└──────────────────────────────────────────┘  └─────────────────────────────────┘

ROW 3 — THREE EQUAL CHARTS (33% each):
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│  Recharts BarChart    │  │  Recharts PieChart    │  │  Recharts BarChart    │
│  HORIZONTAL           │  │  DONUT                │  │  GROUPED BARS         │
│  "Best Clip Style"    │  │  "Platform Upload     │  │  "Monthly Output"     │
│  Y: style names       │  │  Distribution"        │  │  X: last 6 months     │
│  X: upload count      │  │  YouTube / TikTok /   │  │  Blue bars: generated │
│  Answers: which style │  │  Instagram / X /      │  │  Green bars: uploaded │
│  gets approved most?  │  │  Facebook with %      │  │  Side by side per     │
│  Sort by count desc   │  │  labels               │  │  month                │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘

ROW 4 — TABLE + HEATMAP (50% each):
┌────────────────────────────────────┐  ┌──────────────────────────────────────┐
│  HTML table                        │  │  Custom SVG (GitHub-style heatmap)   │
│  "Top YouTube Source Channels"     │  │  "Upload Activity Calendar"          │
│  Columns:                          │  │  52 columns × 7 rows = one year     │
│  Channel | Generated | Uploaded    │  │  Each cell = one day                 │
│  | Approval %                      │  │  Color intensity = upload count:     │
│  Top 10 channels sorted by         │  │  0=light grey, 1=light green,        │
│  uploaded count descending         │  │  2=medium green, 3+=dark green       │
│  Answers: whose content clips best?│  │  Hover: shows count for that day     │
└────────────────────────────────────┘  └──────────────────────────────────────┘
```

### Data Sources
| Widget | Query |
|---|---|
| Streak | COUNT consecutive days WHERE analytics_events has clip_uploaded or post_marked_uploaded |
| Generated count | COUNT(clips) WHERE status != 'FAILED' |
| Uploaded count | COUNT(clips) WHERE manually_uploaded = true |
| Approval rate | uploaded / generated * 100 |
| Avg virality score | AVG(edit_state->source->virality_score) |
| Generated vs Uploaded area | analytics_events grouped by created_at::date |
| Score trend | AVG score per ISO week, clips table |
| Status breakdown | COUNT grouped by status |
| Best clip style | COUNT clips WHERE manually_uploaded=true, grouped by clip_style |
| Platform distribution | COUNT analytics_events WHERE event_type=post_marked_uploaded, group by platform |
| Monthly output | analytics_events grouped by date_trunc('month') |
| Source channels | REGEXP_EXTRACT from edit_state.source.channel_name, aggregate |
| Activity heatmap | analytics_events WHERE type in [clip_uploaded, post_marked_uploaded] grouped by date |

---

## 11. All Screens + Layouts

### Persistent Sidebar (all app screens)
```
[Velora logo]
─────────────
Dashboard       /dashboard
Campaigns       /campaigns
Schedule        /schedule
Analytics       /analytics
Settings        /settings
─────────────
[user email]
[Logout]
```
On mobile: collapses to bottom tab bar with icons.

---

### Screen 1: Landing Page (`/`)
**Sections (top to bottom):**
- Header: Velora logo (left) + Sign In button (right)
- Hero: Full-width, large headline about zero-cost Whop automation, sub-headline, "Get Started" CTA
- Features: 2-column zig-zag blocks (4 features): YouTube Ingestion / AI Hook Selection / Auto-cut & Drive Sync / Agentic Full Edit
- Roadmap: masonry grid, greyed cards labelled "Coming Soon": Local Ubuntu Daemon / CapCut Template Gen / A/B Analytics / AI Agent Edit
- Footer: logo + tagline

**Colors:** bg=#09090B, accent=#3B82F6, text=#FAFAFA, secondary=#71717A
**Cards:** 24px border-radius, diffused whisper shadows
**Typography:** Cabinet Grotesk/Outfit for headlines, Geist/Satoshi for body

---

### Screen 2: Sign In (`/signin`)
Centered card on dark bg. Logo. "Sign In" heading. Email + Password fields. Pill button. "Create account" link.

### Screen 3: Sign Up (`/signup`)
Same card. Email + Password + Confirm Password. "Create Account" button. "Sign in" link.

### Screen 4: Pending Approval (`/pending`)
Full-screen, no sidebar. Lock icon. "Account Pending" heading.
Numbered steps:
1. Open your Supabase dashboard
2. Go to Table Editor → users table
3. Find your email row → change role from 'guest' to 'admin' → Save
"I've updated my role" button → checks role → if admin: redirect to /dashboard → if still guest: show error.

---

### Screen 5: Dashboard (`/dashboard`)
```
[SIDEBAR] │ Header: "Dashboard"
          │ ──────────────────────────────────────────────────────────
          │ [🔥 14d streak] [Generated: 87] [Uploaded: 52] [60% approval] [78 avg score]
          │  (5 stat pills, full width)
          │ ──────────────────────────────────────────────────────────
          │ [Area Chart — Generated vs Uploaded (60%)] [Donut — Status (40%)]
          │ ──────────────────────────────────────────────────────────
          │ [View full analytics →]
          │ ──────────────────────────────────────────────────────────
          │ "Recent Campaigns"                         [+ New Campaign]
          │ [Campaign card] [Campaign card] [Campaign card] [Campaign card]
```
Campaign card: cover photo as bg, gradient overlay, title, clip count badge, status dot.

---

### Screen 6: Campaign List (`/campaigns`)
Same as Recent Campaigns section but full page, all campaigns, search field.

---

### Screen 7: Campaign Page (`/campaigns/[id]`)
```
[SIDEBAR] │ [Cover photo blurred — banner background]
          │ [Title]        [n clips]    [Edit ✎]   [⋮ Delete]
          │ ──────────────────────────────────────────────────────────
          │ [All] [Processing] [Done] [Rejected] [Failed]   [Generate New Clips →]
          │ ──────────────────────────────────────────────────────────
          │ [Clip card grid — masonry 9:16 cards]
          │ [Empty state if no clips: "Generate your first clips →"]
```

**Clip Card states:**
- **Processing:** animated pulse skeleton. Current step label animating. No actions yet.
- **Done:** Static video frame (first frame of proxy). Hook title overlay (gradient). Virality score badge (green ≥75, yellow 50–74, red <50). Mode badge (Simple/Agentic). Three-dot menu top-right.
- **Done + Scheduled:** Blue dot indicator on corner. Tooltip: "Scheduled for TikTok, YouTube"
- **Done + Uploaded:** Green checkmark badge. "Uploaded" text.
- **Failed:** Red border. Error label. "Retry" button.
- **Rejected:** Greyed. Reduced opacity. "Restore" button visible.
- **Superseded:** Hidden by default. Toggle "Show superseded" in filter bar reveals them.

**Three-dot menu on Done card:**
Open Editor / Add to Planner / Download from Drive / Reject / Delete / Mark as Uploaded

---

### Screen 8: Clip Editor (`/campaigns/[id]/clips/[id]`)
```
[← Campaign]  [Hook Title]       [v1 ▼]   [Add to Planner]  [Reject]  [Delete]
──────────────────────────────────────────────────────────────────────────────────────
[VIDEO PREVIEW (360p proxy)         ] │ [CHAT PANEL                               ]
[Standard controls: play/seek/vol   ] │ [Scrollable message history               ]
[                                   ] │ [User msgs right (blue)                   ]
[                                   ] │ [AI msgs left (grey)                      ]
[                                   ] │ [Each AI msg has "Undo" link              ]
────────────────────────────────────  │ [─────────────────────────────────────    ]
[TIMELINE                           ] │ [Type a message...]           [Send]      ]
[wavesurfer.js waveform display     ]
[── Row 1: segment blocks ─────────]  (drag edges to trim)
[── Row 2: caption blocks ─────────]  (click for style edit)
[── Row 3: hook SFX bar ───────────]  (click for SFX details)
[── Row 4: hook music bar ─────────]  (click for track details)
[── Row 5: background music bar ───]  (click for track details)
──────────────────────────────────────────────────────────────────────────────────────
[Selected panel — appears on click, shows transcript/style/track details]
──────────────────────────────────────────────────────────────────────────────────────
[Duration: 30s | 45s | 60s | 90s | Dynamic]          [Preview (360p)]  [Export Final]
```
**Selected segment panel:** transcript text for that segment + Remove button + Mark as emphasized toggle
**Selected caption panel:** Font size slider / Primary color picker / Secondary color picker / Animation dropdown (none/word_pop/fade_in/karaoke)
**Selected music/SFX panel:** Track name, BPM (if applicable), Duration, "Change track" button → triggers new sound library search via chat/background process
**Preview button:** Queues proxy render on Colab (~60s). Button shows spinner + "Rendering..."
**Export Final button:** Queues full 1080×1920 render (~3–5min). Creates new version.
**Version dropdown:** v1, v2, v3... with timestamps. Switching loads that version's edit_state.

---

### Screen 9: Content Planner (`/schedule`)
```
[SIDEBAR] │ Header: "Content Planner"
          │ [🔥 14d streak]  [Weekly goal: 4/7 ●●●●○○○]  [Backlog: 12 clips]  [Batch Schedule]
          │ ──────────────────────────────────────────────────────────
          │ [Calendar] [Queue] [Backlog]    [Platform: All ▼]
          │ ──────────────────────────────────────────────────────────

CALENDAR VIEW:
          │ [react-big-calendar — month/week/day toggle]
          │ Events: platform-color-coded blocks
          │ Click event → Quick View panel (caption + copy assets button + status)
          │ Drag event → reschedule (updates target_date/time)
          │ Click empty slot → Add to Planner modal

QUEUE VIEW:
          │ Grouped by date
          │ Date header (TODAY, TOMORROW, May 20, etc.)
          │ Each row: [thumbnail] [platform icons] [hook title] [HH:MM] [status pill] [Copy Assets] [Mark Uploaded] [Edit] [Cancel]
          │ READY rows highlighted with green left border
          │ TODAY rows highlighted with blue left border

BACKLOG VIEW:
          │ "Clips ready to schedule"
          │ Sort: [Virality ▼] [Date] [Style]
          │ Grid of clip cards (same as campaign page cards)
          │ Each card has "Add to Planner" button (primary action)
```

---

### Screen 10: Analytics (`/analytics`)
Full layout described in Section 10. Time range filter top-right. 4 rows of widgets.

---

### Screen 11: Settings — Profile (`/settings`)
Left nav: Profile | Integrations | Advanced

Profile tab:
- Email (read-only)
- Role badge: "Role: Admin" (read-only)
- Change password form

---

### Screen 12: Settings — Integrations (`/settings?tab=integrations`)
```
SECTION: AI Keys
Gemini API key        [•••••• ] [Update] [Test ✅/❌]
Groq API key          [•••••• ] [Update] [Test ✅/❌]
Freesound API key     [•••••• ] [Update] [Test ✅/❌]

SECTION: Google Drive
Service Account JSON  [large textarea, masked after save] [Update] [Test ✅/❌]
Drive Root Folder ID  [input field] [Test ✅/❌]
                      [How to find this? ↗] link

[Save All]
```

---

### Screen 13: Settings — Advanced (`/settings?tab=advanced`)
```
SECTION: Model Router
Provider priority (drag to reorder):
1. [ON ●]  Groq — llama-3.3-70b-versatile   [Test ✅]
2. [ON ●]  Gemini 2.5 Flash-Lite             [Test ✅]
[+ Add provider]

Per-task model assignments:
Hook Selection      [Gemini Flash-Lite    ▼]
Director Agent      [Groq Llama 3.3 70B  ▼]
Caption Agent       [Groq Llama 3.3 70B  ▼]
Code Generation     [Groq Llama 3.3 70B  ▼]
CapCut Guide        [Gemini Flash-Lite    ▼]
Chat Edits          [Groq Llama 3.3 70B  ▼]

Active model indicator: small colored dot in sidebar shows current provider.

SECTION: Caption Style Defaults
[6 preset cards in 2×3 grid]
Each: style name + static preview image + "Set as Default" button
Click to expand: font name, animation type, primary color swatch, secondary color swatch, position

SECTION: Content Planner Defaults
Weekly Upload Goal    [7] (number input)
Default platforms     [TikTok ✓] [YouTube ✓] [Instagram] [X] [Facebook]
Best time hints       [ON toggle] (shows time suggestions in scheduler)

SECTION: Clip Generation Defaults
Default Clip Style    [Auto ▼]
Default Duration      [Dynamic ▼]
Default Export Preset [TikTok ▼]
```

---

### Modals

**M1: New Campaign Modal** (overlay)
```
"New Campaign"
Campaign Title          [text input]
Campaign Instructions   [large textarea]
                        Placeholder: "Describe your Whop product, target audience,
                        content style, what topics perform best, tone guidelines,
                        things to avoid..."
Cover Photo             [drag-and-drop upload area]
Whop URL (optional)     [text input — reference only, never fetched]
                        [Cancel]   [Create Campaign]
```

**M2: Edit Campaign Slide-over** (from right)
Same fields as M1. "Regenerate Brief" button. Save/Cancel.

**M3: Generate New Clips Modal** (overlay)
```
"Generate New Clips"
YouTube URL     [large prominent input]

MODE:
[Simple — CapCut Assets]   [Agentic — Full Edit]
(two large toggle cards, selected shows cobalt border)

Clip Style   [Auto ▼]  Auto/Hook-First/Value Bomb/Story Arc/Controversy/Proof/Tutorial
Duration     [30s] [45s] [60s] [90s] [Dynamic]  (pill buttons)

▼ Add specific instructions (collapsible section)
  [optional free-text prompt input]

                        [Cancel]   [Generate]

--- AFTER GENERATE CLICKED ---
✓ Fetching transcript...
✓ Gemini selecting hooks...
✓ Queued 4 clips to process
OR: ℹ "No more good segments found: [Gemini's reason]"
(auto-closes on success after 1.5s)
```

**M4: Add to Content Planner Modal** (overlay)
```
"Add to Content Planner"
[Clip thumbnail]  [Hook title]  [Virality score badge]

Caption:
[AI-generated caption — editable textarea]
[Generate for platform ▼] button (regenerates caption for specific platform)
Char count shown, turns red if over platform limit.

Hashtags:
[#whop] [#reselling] [#shorts] [× remove] [+ add]

Platforms:  (checkboxes)
[✓] TikTok    [✓] YouTube    [ ] Instagram    [ ] X    [ ] Facebook

Date:   [date picker]
Time:   [time picker]    [Best time hint: 7–9pm ●]

Notes:  [optional text input]

Series: [None ▼ / or existing series names]

                   [Cancel]   [Add to Planner]
```

**M5: Batch Schedule Modal** (overlay)
```
"Batch Schedule"
[List of backlog clips with checkboxes]
[Select All] button

Assign to:
Platforms     [TikTok ✓] [YouTube ✓] [Instagram] [X]
Start date    [date picker]
Cadence       [Daily] [Every 2 days] [Weekly]
Time          [10:00 AM]

Preview:
Clip 1 → May 15 at 10:00 AM
Clip 2 → May 16 at 10:00 AM
Clip 3 → May 17 at 10:00 AM
...

                   [Cancel]   [Schedule {n} Clips]
```

**M6: Delete Confirmation Modal** (overlay)
```
⚠ Delete [item name]?
[Clip] "This will delete the clip and its Drive folder. This cannot be undone."
[Campaign] "This will delete [n] clips and all their Drive folders. This cannot be undone."
                   [Cancel]   [Delete Permanently]
```

---

## 12. Complete Screen Map

| # | Screen/Modal | Route | Notes |
|---|---|---|---|
| 1 | Landing Page | / | Public, no auth |
| 2 | Sign In | /signin | |
| 3 | Sign Up | /signup | |
| 4 | Pending Approval | /pending | Locked, no sidebar |
| 5 | Dashboard | /dashboard | Quick stats + 2 charts + recent campaigns |
| 6 | Campaign List | /campaigns | All campaigns |
| 7 | Campaign Page | /campaigns/[id] | Clip grid + filter tabs |
| 8 | Clip Editor | /campaigns/[id]/clips/[id] | Timeline + chat + 5 audio layers |
| 9 | Content Planner | /schedule | Calendar + Queue + Backlog |
| 10 | Analytics | /analytics | 8 widgets, time filter |
| 11 | Settings Profile | /settings | |
| 12 | Settings Integrations | /settings?tab=integrations | |
| 13 | Settings Advanced | /settings?tab=advanced | Model router + captions + defaults |
| M1 | New Campaign Modal | overlay | |
| M2 | Edit Campaign Slide-over | overlay | |
| M3 | Generate New Clips Modal | overlay | |
| M4 | Add to Planner Modal | overlay | Caption + platform + date/time |
| M5 | Batch Schedule Modal | overlay | Multi-clip scheduling |
| M6 | Delete Confirmation Modal | overlay | |

---

## 13. Build Phases

### Phase 1 — Working Core Loop (Build this first. Nothing else until it works.)
Paste URL → clips appear → Colab processes → Drive link shows on card.
- Auth pages, Dashboard skeleton, Campaign page, Clip Cards, Generate modal
- Supabase schema + RLS, /api/ingest (youtube-transcript + Gemini), /api/generate-brief, /api/upload-cover
- Colab: listener → yt-dlp → Groq Whisper → ffmpeg → srt → Gemini guide → Google Doc → Drive → DONE
- Supabase Realtime subscription in frontend → live step labels on cards

### Phase 2 — Clip Quality (Agentic Mode)
- Clip Style + Duration + User Prompt in Generate modal
- Director Agent, Caption Agent, Code Agent
- Three-layer audio: hook SFX + hook music + background music via sound library
- Self-eval loop
- Agentic supersedes Simple logic

### Phase 3 — Clip Editor
- wavesurfer.js timeline with 5 layer rows
- Chat panel + /api/edit-chat
- /api/render-preview → Colab proxy render trigger
- Version history + Export Final
- Sound library change track from editor

### Phase 4 — Content Planner
- content_schedule + content_series tables
- /schedule page: Calendar + Queue + Backlog views
- Add to Planner modal (M4) + Batch Schedule (M5)
- Copy Assets button
- Readiness checklist
- Weekly goal tracker
- /api/schedule-post, /api/generate-caption, /api/mark-uploaded

### Phase 5 — Analytics
- analytics_events table + event writes on every action
- Dashboard chart widgets (area + donut)
- Full Analytics page (all 8 widgets)
- Time range filter

### Phase 6 — Settings + Model Router
- All Settings tabs
- LiteLLM config builder from UI
- Test Connection buttons
- Caption style preview cards
- Content planner defaults

### Phase 7 — Design Polish (Only after all features work)
- Cabinet Grotesk / Geist fonts loaded
- Spring/stagger animations
- Masonry clip grid
- Frosted glass modals
- Skeleton loaders on clip cards
- Micro-interactions on buttons

---

## 14. External Accounts (All Free, One-Time Setup)

| Service | URL | Purpose |
|---|---|---|
| Supabase | supabase.com | DB + Auth + Realtime |
| Google Cloud Console | console.cloud.google.com | Service Account + Drive API + Docs API |
| Google AI Studio | aistudio.google.com | Gemini API key |
| Groq | console.groq.com | Groq + Whisper API key |
| Freesound | freesound.org/apiv2/apply | Music + SFX API key |
| Netlify | netlify.com | Frontend hosting + serverless functions |
| GitHub | github.com | Code repository |
| Google Colab | colab.research.google.com | Processing engine (browser tab) |

**Drive Setup (One-Time, 5 Minutes):**
1. Create folder "Velora" in your personal Google Drive
2. Right-click → Share → paste Service Account email (e.g. velora@project.iam.gserviceaccount.com)
3. Set permission to Editor → Share
4. Copy the folder ID from the URL bar (the long string after `/folders/`)
5. Paste into Velora Settings → Integrations → Drive Root Folder ID

---

## 15. Key Architecture Decisions + Rationale

| Decision | Choice | Rationale |
|---|---|---|
| Webhook trigger | Supabase Realtime WebSocket | Colab connects OUT — no Ngrok, no URL reconfiguration, 2M messages/month free |
| Social media posting | Manual by creator | Creator maintains control, no OAuth complexity, no platform API approval delays |
| Upload infrastructure | None (removed) | No automated posting = no GitHub Actions needed for this |
| File storage | Google Drive only, no Supabase Storage | Supabase free = 500MB, Drive = 15GB; all files go to Drive |
| SA storage fix | User shares personal Drive folder with SA | SA has no storage; files count against user's 15GB personal quota |
| Thumbnail system | Removed (too complex) | Platform auto-uses first video frame; complexity vs value not justified |
| Audio layers | 3 layers: hook SFX + hook music + bg | Hook SFX stops scroll, hook music sets energy, bg adds production value |
| Sound library | Drive-cached meta.json per track | After 20 clips, 60+ tracks cached; future clips rarely call Freesound |
| Beat sync | librosa → beat_map.json → Drive | Processed once, cached forever, never reprocessed |
| Video agent | Custom Python orchestrator | video-use requires Claude Code (paid); our loop uses free Groq |
| Model routing | LiteLLM | Single config change swaps any model without touching business logic |
| Analytics | analytics_events table only | No external SDK; all charts are SQL queries against one table |
| Content planning | Personal planner + manual upload | Simple, zero-cost, gives creator full control over what actually posts |