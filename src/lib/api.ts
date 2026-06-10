import { supabase } from './supabase';

const rawBase = (import.meta.env.VITE_API_BASE_URL || window.location.origin).trim();
const API_BASE = rawBase.replace(/^["']|["']$/g, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body.error || 'Request failed');
  }

  return body.data as T;
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

export async function ingestClip(body: IngestRequest): Promise<IngestResponse> {
  return apiRequest<IngestResponse>('/api/ingest', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
