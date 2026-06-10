import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../lib/types/database';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchEpoch, setRefetchEpoch] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCampaigns() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setCampaigns([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!cancelled) setCampaigns(data || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCampaigns();

    return () => { cancelled = true; };
  }, [refetchEpoch]);

  const refetch = () => setRefetchEpoch((e) => e + 1);

  return { campaigns, loading, error, refetch };
}
