import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video } from 'lucide-react';
import { cn } from '../lib/utils';
import ClipCard from './ClipCard';
import type { Clip } from '../lib/types/database';

interface ClipGridProps {
  clips: Clip[];
  loading?: boolean;
  emptyMessage?: string;
  filter?: 'all' | 'processing' | 'done' | 'error';
  onRetry?: (id: string) => void;
  onReject?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenEditor?: (id: string) => void;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'done', label: 'Done' },
  { key: 'error', label: 'Error' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

export default function ClipGrid({
  clips,
  loading,
  emptyMessage = 'No clips yet',
  filter: externalFilter,
  onRetry,
  onReject,
  onRestore,
  onDelete,
  onOpenEditor,
}: ClipGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');

  const currentFilter = externalFilter || activeFilter;

  const filtered = clips.filter((clip) => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'processing') return clip.status === 'processing' || clip.status === 'queued';
    return clip.status === currentFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') {
      const aScore = a.virality_score ?? 0;
      const bScore = b.virality_score ?? 0;
      return bScore - aScore;
    }
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const counts = {
    all: clips.length,
    processing: clips.filter((c) => c.status === 'processing' || c.status === 'queued').length,
    done: clips.filter((c) => c.status === 'done').length,
    error: clips.filter((c) => c.status === 'error').length,
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-4 w-16 bg-[rgba(255,255,255,0.1)] rounded" />
            <div className="h-5 w-3/4 bg-[rgba(255,255,255,0.1)] rounded" />
            <div className="h-4 w-1/2 bg-[rgba(255,255,255,0.1)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5',
                currentFilter === f.key
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-steel hover:text-zinc-50 border border-transparent'
              )}
            >
              {f.label}
              <span className="text-[10px] opacity-60">({counts[f.key]})</span>
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5 text-xs text-muted-steel focus:outline-none focus:border-primary"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="score">Highest Score</option>
        </select>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((clip) => (
              <div key={clip.id}>
                <ClipCard
                  clip={clip}
                  onRetry={onRetry}
                  onReject={onReject}
                  onRestore={onRestore}
                  onDelete={onDelete}
                  onOpenEditor={onOpenEditor}
                />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-[rgba(255,255,255,0.01)]"
          >
            <Video className="w-10 h-10 text-muted-steel mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold text-zinc-50 mb-1">{emptyMessage}</h3>
            <p className="text-muted-steel text-sm">Extract clips from a YouTube video to get started.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
