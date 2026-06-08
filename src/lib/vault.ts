import { supabase } from './supabase';

export async function storeSecret(key: string, value: string): Promise<string | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.rpc('create_or_update_secret', {
    p_key: key,
    p_value: value,
    p_user_id: user.id,
  });

  if (error) {
    throw error;
  }

  return data as string | null;
}

export async function getDecryptedSecret(secretId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_decrypted_secret', {
    p_secret_id: secretId,
  });

  if (error) {
    throw error;
  }

  return data as string | null;
}
