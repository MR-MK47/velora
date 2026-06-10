import { supabaseAdmin } from './supabase';
import { errorResponse } from './supabase';

function extractAuthHeader(headers: Record<string, unknown> | Headers): string {
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get('authorization') || (headers as Headers).get('Authorization') || '';
  }
  const h = headers as Record<string, string>;
  return h['authorization'] || h['Authorization'] || '';
}

export async function authenticateRequest(headers: Record<string, unknown> | Headers): Promise<string | ReturnType<typeof errorResponse>> {
  const authHeader = extractAuthHeader(headers);
  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse('Missing or invalid Authorization header', 401);
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return errorResponse('Unauthorized', 401);
  }

  return user.id;
}
