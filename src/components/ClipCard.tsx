import { motion } from 'motion/react';
import { Clock, Loader2, CheckCircle2, AlertCircle, XCircle, MoreHorizontal, Play, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Clip } from '../lib/types/database';

interface ClipCardProps {
  clip: Clip;
  onRetry?: (id: string) => void;
  onReject?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenEditor?: (id: string) => void;
}

export default function ClipCard({ clip, onRetry, onReject, onRestore, onDelete, onOpenEditor }: ClipCardProps) {
  const editState = clip.edit_state as Record<string, unknown> | null;
  const hookTitle = (editState?.hook_title as string) || clip.id.slice(0, 8);
  const viralityScore = clip.virality_score ?? (editState?.virality_score as number | null) ?? null;
  const duration = clip.start_ts != null && clip.end_ts != null
    ? `${(clip.end_ts - clip.start_ts).toFixed(0)}s`
    : null;

  const scoreColor = viralityScore != null
    ? viralityScore >= 75 ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : viralityScore >= 50 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'
    : '';

  const statusConfig = {
    queued: { icon: Clock, label: 'Queued', class: 'border-zinc-600/50 opacity-70' },
    processing: { icon: Loader2, label: clip.step || 'Processing', class: 'border-primary/50 animate-pulse' },
    done: { icon: CheckCircle2, label: 'Done', class: 'border-green-500/30' },
    error: { icon: AlertCircle, label: 'Error', class: 'border-red-500/40' },
  };

  const config = statusConfig[clip.status] || statusConfig.queued;
  const StatusIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'bg-charcoal-ink border rounded-xl p-4 flex flex-col gap-3 transition-colors',
        config.class,
        clip.status === 'done' && 'hover:border-primary/40'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={cn(
            'w-4 h-4 shrink-0',
            clip.status === 'processing' && 'animate-spin text-primary',
            clip.status === 'done' && 'text-green-400',
            clip.status === 'error' && 'text-red-400',
            clip.status === 'queued' && 'text-zinc-500',
          )} />
          <span className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            clip.status === 'processing' && 'text-primary',
            clip.status === 'done' && 'text-green-400',
            clip.status === 'error' && 'text-red-400',
            clip.status === 'queued' && 'text-zinc-500',
          )}>
            {config.label}
          </span>
        </div>
        {clip.status === 'done' && (
          <div className="relative group">
            <button className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-muted-steel hover:text-white transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl z-50 hidden group-hover:block">
              <div className="py-1">
                {onOpenEditor && (
                  <button onClick={() => onOpenEditor(clip.id)} className="w-full px-3 py-2 text-left text-xs text-zinc-50 hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2">
                    <Play className="w-3.5 h-3.5" /> Open Editor
                  </button>
                )}
                {clip.drive_url && (
                  <a href={clip.drive_url} target="_blank" rel="noopener noreferrer" className="w-full px-3 py-2 text-left text-xs text-zinc-50 hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2 no-underline">
                    Download Assets
                  </a>
                )}
                {onReject && (
                  <button onClick={() => onReject(clip.id)} className="w-full px-3 py-2 text-left text-xs text-zinc-50 hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(clip.id)} className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hook Title */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-50 leading-snug line-clamp-2">{hookTitle}</p>
      </div>

      {/* Score / Duration / Mode */}
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        {viralityScore != null && (
          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', scoreColor)}>
            {viralityScore}
          </span>
        )}
        {duration && (
          <span className="text-[10px] text-muted-steel font-mono">{duration}</span>
        )}
        <span className="text-[10px] text-muted-steel uppercase tracking-wider ml-auto">
          {clip.mode}
        </span>
      </div>

      {/* Error message */}
      {clip.status === 'error' && clip.error_message && (
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-red-400/80 line-clamp-2 flex-1">{clip.error_message}</p>
          {onRetry && (
            <button onClick={() => onRetry(clip.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
