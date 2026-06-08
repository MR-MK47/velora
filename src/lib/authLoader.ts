import { redirect } from 'react-router-dom';
import { supabase } from './supabase';

export async function requireAuthLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw redirect('/login');
  }
  return { user: session.user };
}
