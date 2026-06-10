import { X, Link2, CheckCircle2, Circle, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ingestClip } from '../lib/api';
import { useCampaigns } from '../hooks/useCampaigns';
import type { Campaign } from '../lib/types/database';
import { useNavigate } from 'react-router-dom';

export default function ExtractionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const navigate = useNavigate();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [mode, setMode] = useState<'simple' | 'agentic'>('simple');
  const [clipStyle, setClipStyle] = useState('auto');
  const [targetDuration, setTargetDuration] = useState('dynamic');
  const [userPrompt, setUserPrompt] = useState('');

  const [result, setResult] = useState<{ clip_ids?: string[]; no_segments?: boolean; reason?: string } | null>(null);

  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setUrl('');
      setIsExtracting(false);
      setStep(0);
      setError(null);
      setResult(null);
      setMode('simple');
      setClipStyle('auto');
      setTargetDuration('dynamic');
      setUserPrompt('');
    }, 300);
  };

  const startExtraction = async () => {
    if (!url || !selectedCampaignId) return;

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setStep(1);

    try {
      const response = await ingestClip({
        youtube_url: url,
        campaign_id: selectedCampaignId,
        mode,
        clip_style: clipStyle,
        target_duration: targetDuration,
        user_prompt: userPrompt || undefined,
      });

      setStep(4);

      if (response.no_segments) {
        setResult({ no_segments: true, reason: response.reason });
      } else {
        setResult({ clip_ids: response.clip_ids });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
      setStep(5);
    }
  };

  const stepItems = [
    { label: 'Validating URL & Campaign', done: step >= 2 },
    { label: 'Fetching Transcript & Analyzing Hooks', done: step >= 3 },
    { label: 'Queuing Clips to Supabase', done: step >= 4 },
  ];

  const clipStyleOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'educational', label: 'Educational' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'commentary', label: 'Commentary' },
    { value: 'storytelling', label: 'Storytelling' },
  ];

  const durationOptions = [
    { value: 'dynamic', label: 'Dynamic' },
    { value: '15-30', label: '15-30s' },
    { value: '30-60', label: '30-60s' },
    { value: '60+', label: '60s+' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[32px] z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-start bg-[rgba(255,255,255,0.02)] shrink-0">
                <div>
                  <h2 className="font-cabinet text-2xl font-bold text-zinc-50 tracking-tight mb-1">Extraction Engine</h2>
                  <p className="text-sm font-medium text-muted-steel">AI-Powered Content Harvesting</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-muted-steel hover:text-zinc-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                {/* URL Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Source URL</label>
                  <div className="relative group">
                    <Link2 className="absolute left-4 w-5 h-5 text-muted-steel group-focus-within:text-primary transition-colors top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full h-[56px] pl-12 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 font-geist-mono text-sm placeholder:text-muted-steel/50"
                      disabled={isExtracting}
                    />
                  </div>
                </div>

                {/* Campaign Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Campaign</label>
                  <div className="relative">
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      disabled={isExtracting || campaignsLoading}
                      className="w-full h-[48px] px-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 text-sm appearance-none cursor-pointer disabled:opacity-50"
                    >
                      {campaignsLoading ? (
                        <option>Loading campaigns...</option>
                      ) : campaigns.length === 0 ? (
                        <option>No campaigns found</option>
                      ) : (
                        campaigns.map((c: Campaign) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel pointer-events-none" />
                  </div>
                </div>

                {/* Mode Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Mode</label>
                  <div className="flex gap-2">
                    {(['simple', 'agentic'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        disabled={isExtracting}
                        className={cn(
                          'flex-1 h-[44px] rounded-xl text-sm font-semibold transition-all border',
                          mode === m
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-[rgba(255,255,255,0.02)] text-muted-steel border-[rgba(255,255,255,0.08)] hover:text-zinc-50'
                        )}
                      >
                        {m === 'simple' ? 'Simple' : 'Agentic'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clip Style + Target Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Style</label>
                    <select
                      value={clipStyle}
                      onChange={(e) => setClipStyle(e.target.value)}
                      disabled={isExtracting}
                      className="w-full h-[44px] px-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 text-sm appearance-none cursor-pointer disabled:opacity-50"
                    >
                      {clipStyleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Duration</label>
                    <div className="flex gap-1.5">
                      {durationOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTargetDuration(opt.value)}
                          disabled={isExtracting}
                          className={cn(
                            'flex-1 h-[44px] rounded-xl text-xs font-semibold transition-all border',
                            targetDuration === opt.value
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-[rgba(255,255,255,0.02)] text-muted-steel border-[rgba(255,255,255,0.08)] hover:text-zinc-50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User Prompt */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Custom Instructions (optional)</label>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    disabled={isExtracting}
                    placeholder="e.g., Focus on technical insights, avoid beginner content..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 text-sm placeholder:text-muted-steel/50 resize-none disabled:opacity-50"
                  />
                </div>

                <button
                  onClick={startExtraction}
                  disabled={!url || !selectedCampaignId || isExtracting}
                  className="w-full h-[48px] bg-primary text-zinc-950 text-sm font-semibold rounded-xl hover:bg-white active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Extract Clips
                </button>

                {/* Processing Steps */}
                <AnimatePresence>
                  {isExtracting && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden origin-top"
                    >
                      {stepItems.map((s, i) => {
                        const itemStep = i + 1;
                        const isActive = step === itemStep;
                        const isDone = step > itemStep;

                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-all duration-500",
                              isDone ? "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]" :
                              isActive ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-[rgba(255,255,255,0.01)] border-transparent opacity-40 grayscale"
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                            ) : isActive ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-steel" />
                            )}
                            <span className={cn(
                              "font-medium",
                              isDone ? "text-muted-steel" : isActive ? "text-zinc-50" : "text-muted-steel"
                            )}>{s.label}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-400">{error}</p>
                    </div>
                    <button
                      onClick={startExtraction}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                    >
                      Retry
                    </button>
                  </motion.div>
                )}

                {/* Result */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border",
                      result.clip_ids ? "bg-green-500/5 border-green-500/20" : "bg-yellow-500/5 border-yellow-500/20"
                    )}
                  >
                    {result.clip_ids ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      {result.clip_ids ? (
                        <>
                          <p className="text-sm font-medium text-green-400">Success!</p>
                          <p className="text-xs text-muted-steel mt-1">{result.clip_ids.length} clip{result.clip_ids.length !== 1 ? 's' : ''} queued for processing.</p>
                          <button
                            onClick={() => {
                              handleClose();
                              navigate('/app/campaigns');
                            }}
                            className="mt-2 text-xs font-semibold text-primary hover:text-white transition-colors"
                          >
                            View in Campaigns →
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-yellow-400">No segments found</p>
                          <p className="text-xs text-muted-steel mt-1">{result.reason || 'The AI could not extract suitable clips from this video.'}</p>
                          <button
                            onClick={startExtraction}
                            className="mt-2 text-xs font-semibold text-primary hover:text-white transition-colors"
                          >
                            Retry with different settings
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] flex justify-between items-center shrink-0">
                <div className="text-xs text-muted-steel font-medium">
                  {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} available
                </div>
                <button
                  onClick={handleClose}
                  className="border border-[rgba(255,255,255,0.08)] text-muted-steel hover:text-zinc-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
