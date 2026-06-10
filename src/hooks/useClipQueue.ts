import { useMemo } from 'react';
import { useClips } from './useClips';
import type { Clip } from '../lib/types/database';

export function useClipQueue(campaignId?: string) {
  const { clips, loading, error } = useClips(campaignId);

  const grouped = useMemo(() => {
    const queued: Clip[] = [];
    const processing: Clip[] = [];
    const done: Clip[] = [];
    const errored: Clip[] = [];

    for (const clip of clips) {
      if (clip.status === 'queued') queued.push(clip);
      else if (clip.status === 'processing') processing.push(clip);
      else if (clip.status === 'done') done.push(clip);
      else if (clip.status === 'error') errored.push(clip);
    }

    return { queued, processing, done, errored, total: clips.length };
  }, [clips]);

  return { ...grouped, loading, error };
}
