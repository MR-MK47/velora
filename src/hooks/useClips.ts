import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Clip } from '../lib/types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useClips(campaignId?: string) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setClips([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchClips() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setClips([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('clips')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!cancelled) setClips(data || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load clips');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchClips();

    const channel = supabase
      .channel(`clips-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clips',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload: RealtimePostgresChangesPayload<Clip>) => {
          if (cancelled) return;
          if (payload.eventType === 'INSERT' && payload.new) {
            setClips((prev) => [payload.new as Clip, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setClips((prev) =>
              prev.map((c) => (c.id === (payload.new as Clip).id ? (payload.new as Clip) : c))
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setClips((prev) => prev.filter((c) => c.id !== (payload.old as Clip).id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [campaignId]);

  return { clips, loading, error };
}
