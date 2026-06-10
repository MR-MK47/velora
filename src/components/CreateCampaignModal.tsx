import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (campaignId: string) => void;
}

export default function CreateCampaignModal({ isOpen, onClose, onCreated }: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in.');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          title: name.trim(),
          user_id: user.id,
          status: 'draft',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (data) {
        onCreated(data.id);
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setName('');
      setDescription('');
      setError(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-lg bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-start bg-[rgba(255,255,255,0.02)]">
              <div>
                <h2 className="font-cabinet text-2xl font-bold text-zinc-50 tracking-tight mb-1">New Campaign</h2>
                <p className="text-sm font-medium text-muted-steel">Define your campaign details.</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-muted-steel hover:text-zinc-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Product Launch"
                  className="w-full h-[52px] px-5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 text-sm placeholder:text-muted-steel/50"
                  disabled={isCreating}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Short-form clips promoting our new product line..."
                  rows={3}
                  className="w-full px-5 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 text-sm placeholder:text-muted-steel/50 resize-none"
                  disabled={isCreating}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={isCreating}
                  className="flex-1 border border-[rgba(255,255,255,0.08)] text-muted-steel hover:text-zinc-50 h-[48px] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || isCreating}
                  className="flex-1 bg-primary text-zinc-950 h-[48px] rounded-xl text-sm font-bold hover:bg-white active:translate-y-[1px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {isCreating ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
