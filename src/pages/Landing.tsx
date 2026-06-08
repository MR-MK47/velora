import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Terminal, CheckCircle2, ArrowRight, Server, Play, Zap, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Landing() {
  return (
    <div className="min-h-screen bg-deep-void text-on-surface selection:bg-primary/30">
      {/* TopNavBar */}
      <header className="flex justify-between items-center px-8 py-4 w-full z-50 fixed top-0 bg-deep-void/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
        <div className="text-2xl font-cabinet font-bold text-primary tracking-tight">Velora</div>
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-primary font-medium text-sm transition-colors">Home</a>
          <a href="#engine" className="text-muted-steel hover:text-primary transition-colors text-sm">Engine</a>
          <a href="#roadmap" className="text-muted-steel hover:text-primary transition-colors text-sm">Roadmap</a>
        </nav>
        <Link 
          to="/login"
          className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-primary/20"
        >
          Sign In
        </Link>
      </header>

      <main className="pt-24 pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 min-h-[85vh] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-steel font-medium">v1.0.4 - Automation Engine</span>
            </div>
            
            <h1 className="font-cabinet text-[clamp(56px,8vw,80px)] text-zinc-50 leading-[1.05] tracking-tight">
              Zero-Cost <br />
              <span className="text-primary">Automation</span>
            </h1>
            
            <p className="font-geist font-normal text-muted-steel max-w-[420px] text-lg leading-relaxed">
              High-agency orchestration for content creators. Velora ingest, transcribes, and distributes video assets with surgical precision and zero overhead.
            </p>
            
            <div className="flex items-center gap-6 pt-2">
              <Link 
                to="/signup"
                className="group bg-primary text-zinc-950 px-8 py-4 rounded-lg text-lg font-medium flex items-center gap-3 active:translate-y-[1px] transition-transform shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              >
                Initialize Velora
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#engine" className="border border-[rgba(255,255,255,0.15)] text-on-surface hover:bg-[rgba(255,255,255,0.05)] px-8 py-4 rounded-lg text-lg font-medium transition-colors">
                View Stack
              </a>
            </div>
          </div>

          <div className="md:col-span-5 relative h-full flex items-center justify-center">
            {/* Timeline abstract visualization */}
            <div className="w-full aspect-square relative rounded-xl border border-[rgba(255,255,255,0.08)] bg-charcoal-ink p-6 overflow-hidden flex flex-col gap-3 justify-center shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              {/* Scanline */}
              <motion.div 
                className="absolute inset-y-0 left-0 w-1 bg-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-20"
                animate={{ x: ["0%", "1000%"] }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
              />

              {[0.4, 1, 0.2, 0.8, 0.6, 1].map((opacity, i) => (
                <div key={i} className="w-full flex items-center gap-2">
                  <div className="w-8 flex-shrink-0 text-[10px] text-muted-steel/50 font-geist-mono">
                    CH_0{i+1}
                  </div>
                  <div className="flex-1 h-[2px] bg-[rgba(255,255,255,0.05)] relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 h-full bg-primary"
                      style={{ opacity, width: `${20 + Math.random() * 80}%` }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.5, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}

              {[0.7, 0.3, 0.9, 0.5].map((opacity, i) => (
                <div key={i + 6} className="w-full flex items-center gap-2 mt-2">
                  <div className="w-8 flex-shrink-0 text-[10px] text-primary/50 font-geist-mono">
                    AU_0{i+1}
                  </div>
                  <div className="flex-1 h-[4px] bg-[rgba(255,255,255,0.05)] relative overflow-hidden rounded-full">
                    <motion.div 
                      className="absolute inset-y-0 left-0 h-full bg-primary"
                      style={{ opacity, width: `${40 + Math.random() * 60}%` }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal snippet widget */}
            <div className="absolute -bottom-6 -left-6 bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-4 rounded-lg shadow-2xl backdrop-blur-md min-w-[220px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-xs font-semibold text-on-surface">Auto-Sync Active</span>
              </div>
              <div className="text-[11px] text-muted-steel font-geist-mono leading-relaxed">
                &gt; status: sync_complete<br/>
                &gt; target: g_drive/shorts<br/>
                &gt; throughput: 4.2GB/s
                <span className="inline-block w-1.5 h-3 bg-muted-steel ml-1 align-middle animate-[pulse_1s_step-start_infinite]" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Zig-Zag */}
        <section id="engine" className="py-24 max-w-7xl mx-auto px-8 space-y-32">
          {/* Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center group"
          >
            <div className="order-2 md:order-1 relative aspect-video bg-charcoal-ink rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700" />
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800" alt="Data Pipeline" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-20 pointer-events-none" />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <div className="text-primary text-xs uppercase tracking-[0.2em] font-semibold">01 — PIPELINE</div>
              <h2 className="font-cabinet text-4xl text-zinc-50 font-bold">Instant YouTube Ingestion</h2>
              <p className="text-muted-steel text-lg leading-relaxed">
                Connect your channel or feed specific URLs. Velora's worker nodes pull raw 4K streams directly into our processing buffer with sub-second latency. No manual uploads, no friction.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-on-surface">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  OAuth 2.0 Secure Channel Access
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Automatic Metadata Mapping
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center group"
          >
            <div className="space-y-6">
              <div className="text-primary text-xs uppercase tracking-[0.2em] font-semibold">02 — ANALYSIS</div>
              <h2 className="font-cabinet text-4xl text-zinc-50 font-bold">AI Transcript & Hook Selection</h2>
              <p className="text-muted-steel text-lg leading-relaxed">
                Our proprietary LLM-tuned engine analyzes audio and visual cues to identify 'viral hooks'. It generates frame-accurate timecodes and semantic summaries for rapid curation.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[rgba(255,255,255,0.03)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div className="text-primary font-cabinet text-3xl font-bold mb-1">99.8%</div>
                  <div className="text-[10px] text-muted-steel uppercase tracking-widest font-semibold">Transcription Accuracy</div>
                </div>
                <div className="p-4 bg-[rgba(255,255,255,0.03)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div className="text-primary font-cabinet text-3xl font-bold mb-1">4.2s</div>
                  <div className="text-[10px] text-muted-steel uppercase tracking-widest font-semibold">Mean Analysis Time</div>
                </div>
              </div>
            </div>
            <div className="relative aspect-video bg-charcoal-ink rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700" />
               <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800" alt="AI Analysis Core" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-20 pointer-events-none" />
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center group"
          >
            <div className="order-2 md:order-1 relative aspect-[4/3] bg-charcoal-ink rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700" />
               <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800" alt="Delivery Nodes" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-20 pointer-events-none" />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <div className="text-primary text-xs uppercase tracking-[0.2em] font-semibold">03 — DELIVERY</div>
              <h2 className="font-cabinet text-4xl text-zinc-50 font-bold">Auto-cut & Drive Sync</h2>
              <p className="text-muted-steel text-lg leading-relaxed">
                Finalize your edits and Velora handles the rest. Automated rendering via headless FFmpeg instances followed by direct synchronization to Google Drive, Frame.io, or S3 buckets.
              </p>
              <button className="flex items-center gap-2 text-primary text-sm font-semibold group hover:gap-4 transition-all">
                EXPLORE DELIVERY NODES
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Future Vision / Roadmap */}
        <section id="roadmap" className="py-24 max-w-7xl mx-auto px-8 relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.05),transparent_50%)]" />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 relative"
          >
            <h2 className="font-cabinet text-5xl text-zinc-50 font-bold mb-4">Future Vision</h2>
            <p className="text-muted-steel text-lg">The roadmap to sovereign automation.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            {/* Roadmap Item 1: Wide */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 relative bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden group hover:border-primary/40 transition-colors"
            >
              <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800" alt="Server Infrastructure" className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700" />
              </div>

              <div className="relative z-20 h-full p-8 flex flex-col justify-between pointer-events-none">
                <div className="flex justify-between items-start">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Q3 2024</span>
                  <Server className="w-5 h-5 text-zinc-50/50 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-cabinet text-3xl text-zinc-50 font-bold mb-3 group-hover:text-primary transition-colors">Ubuntu Daemon Engine</h3>
                  <p className="text-muted-steel text-sm max-w-lg leading-relaxed">
                    Decentralized processing. Install the Velora agent on any Linux instance to contribute compute power and reduce platform fees to zero.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Roadmap Item 2: Tall */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
              className="md:row-span-2 relative bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden group hover:border-primary/40 transition-colors"
            >
              <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" alt="Abstract Data" className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/20" />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700" />
              </div>
              
              <div className="relative z-20 h-full p-8 flex flex-col justify-between pointer-events-none">
                <div>
                  <div className="inline-block bg-[rgba(255,255,255,0.1)] text-zinc-50 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold mb-4 border border-[rgba(255,255,255,0.1)]">Integration</div>
                  <h3 className="font-cabinet text-3xl text-zinc-50 font-bold leading-tight group-hover:text-primary transition-colors">CapCut Templates</h3>
                </div>
                <p className="text-muted-steel text-sm leading-relaxed mt-auto">
                  Direct export to CapCut project files with pre-configured AI-timed transitions and dynamic subtitle rendering optimized for vertical formats.
                </p>
              </div>
            </motion.div>

            {/* Roadmap Item 3: Standard */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3 }}
              className="relative bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden group hover:border-primary/40 transition-colors"
            >
               <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" alt="Analytics Dashboard" className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
               </div>

               <div className="relative z-20 h-full p-8 flex flex-col justify-end pointer-events-none">
                  <h3 className="font-cabinet text-2xl text-zinc-50 font-bold mb-3 group-hover:text-primary transition-colors">A/B Testing Nodes</h3>
                  <p className="text-muted-steel text-sm leading-relaxed">
                    Automatically generate three variations of every hook and test them against short-form algorithms in real-time.
                  </p>
               </div>
            </motion.div>

            {/* Roadmap Item 4: Wide / Apply for Beta */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 bg-gradient-to-br from-primary/15 to-zinc-950 border border-primary/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.2),transparent_60%)] group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 p-8 flex-1">
                <div className="inline-block bg-primary text-zinc-950 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold mb-4">Developer Program</div>
                <h3 className="font-cabinet text-3xl text-zinc-50 font-bold mb-3">Sovereign API</h3>
                <p className="text-zinc-50/70 text-sm max-w-md leading-relaxed">
                  Build your own custom workflows on top of our core orchestration layer. Complete control over ingestion, analysis, and rendering.
                </p>
              </div>
              <div className="relative z-10 p-8 pt-0 md:pt-8 flex-shrink-0 w-full md:w-auto text-left md:text-right">
                <Link to="/signup" className="inline-block bg-primary text-zinc-950 px-8 py-4 rounded-xl text-sm font-bold hover:bg-white transition-colors active:translate-y-[1px] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  Apply for Beta
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
