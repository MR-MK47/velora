import { X, Link2, CheckCircle2, Circle, Loader2, Hourglass } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ExtractionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [step, setStep] = useState(0);

  const startExtraction = () => {
    if (!url) return;
    setIsExtracting(true);
    setStep(1);
    
    // Simulate steps
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4500);
    setTimeout(() => {
      setStep(4);
      setTimeout(() => {
        onClose();
        setIsExtracting(false);
        setStep(0);
        setUrl('');
      }, 1000);
    }, 6000);
  };

  const steps = [
    { label: 'Fetching Transcript...', waiting: Circle, active: Loader2, done: CheckCircle2 },
    { label: 'Gemini Analyzing Hooks...', waiting: Circle, active: Loader2, done: CheckCircle2 },
    { label: 'Queuing to Supabase...', waiting: Circle, active: Loader2, done: CheckCircle2 }
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
              className="w-full max-w-2xl bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-start bg-[rgba(255,255,255,0.02)]">
                <div>
                  <h2 className="font-cabinet text-2xl font-bold text-zinc-50 tracking-tight mb-1">Extraction Engine</h2>
                  <p className="text-sm font-medium text-muted-steel">AI-Powered Content Harvesting</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-muted-steel hover:text-zinc-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 flex-1">
                {/* Massive URL Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-[0.2em] px-1">Source URL</label>
                  <div className="relative group flex items-center">
                    <Link2 className="absolute left-4 w-5 h-5 text-muted-steel group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full h-[56px] pl-12 pr-32 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all text-zinc-50 font-geist-mono text-sm placeholder:text-muted-steel/50"
                      disabled={isExtracting}
                    />
                    <button
                      onClick={startExtraction}
                      disabled={!url || isExtracting}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-zinc-950 text-sm font-semibold rounded-lg hover:bg-white active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Extract
                    </button>
                  </div>
                </div>

                {/* Status Card */}
                <div className="relative h-32 rounded-xl border border-[rgba(255,255,255,0.08)] bg-zinc-950 overflow-hidden flex items-end p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_70%)] opacity-50" />
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)] mix-blend-overlay" />
                  
                  <div className="relative z-10 w-full flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Engine Status</div>
                      <div className="font-cabinet font-bold text-2xl text-zinc-50">Optimized</div>
                    </div>
                    <div className="w-12 h-6 bg-[rgba(255,255,255,0.1)] rounded-full p-1 flex items-center cursor-pointer border border-[rgba(255,255,255,0.05)]">
                      <div className="w-4 h-4 bg-primary rounded-full shadow-md transform translate-x-6" />
                    </div>
                  </div>
                </div>

                {/* Processing Steps (Render only when extracting) */}
                <AnimatePresence>
                  {isExtracting && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 overflow-hidden origin-top"
                    >
                      {steps.map((s, i) => {
                        const stepNum = i + 1;
                        const isActive = step === stepNum;
                        const isDone = step > stepNum;
                        
                        const Icon = isDone ? s.done : (isActive ? s.active : s.waiting);
                        
                        return (
                          <div 
                            key={i}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-all duration-500",
                              isDone ? "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]" : 
                              isActive ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-[rgba(255,255,255,0.01)] border-transparent opacity-40 grayscale"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5",
                              isDone ? "text-[#22C55E]" : isActive ? "text-primary animate-spin" : "text-muted-steel"
                            )} />
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

              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-steel">
                  <Hourglass className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-semibold">Estimated time: 42 seconds</span>
                </div>
                <button className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:translate-y-[1px]">
                  Advanced Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
