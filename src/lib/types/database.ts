export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Setting {
  id: string;
  user_id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  title: string;
  youtube_url: string | null;
  status: string;
  campaign_brief?: string | null;
  created_at: string;
}

export interface Clip {
  id: string;
  campaign_id: string;
  user_id: string;
  start_ts: number | null;
  end_ts: number | null;
  status: 'queued' | 'processing' | 'done' | 'error';
  step: string | null;
  current_step?: string | null;
  mode: string;
  clip_style?: string;
  target_duration?: string;
  user_prompt?: string | null;
  virality_score?: number | null;
  edit_state?: unknown;
  drive_url: string | null;
  drive_folder_url?: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSchedule {
  id: string;
  clip_id: string | null;
  user_id: string;
  platform: string | null;
  scheduled_at: string | null;
  caption: string | null;
  hashtags: string[] | null;
  status: string;
  created_at: string;
}

export interface ContentSeries {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  clip_id: string | null;
  event_type: string;
  platform: string | null;
  value: number | null;
  recorded_at: string;
}
