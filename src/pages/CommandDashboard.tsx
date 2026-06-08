import { Link } from 'react-router-dom';
import { Terminal, Plus, Video, TrendingUp, Database, PlayCircle, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const chartData = [
  { time: '02:00', generated: 4, uploaded: 2 },
  { time: '06:00', generated: 12, uploaded: 8 },
  { time: '10:00', generated: 24, uploaded: 18 },
  { time: '14:00', generated: 38, uploaded: 30 },
  { time: '18:00', generated: 45, uploaded: 40 },
  { time: '22:00', generated: 55, uploaded: 51 }
];

export default function CommandDashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40 flex justify-between items-center px-8 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-primary" />
          <h2 className="font-cabinet text-xl font-bold text-zinc-50 tracking-tight">Command Dashboard</h2>
        </div>
        <button className="bg-primary hover:bg-white text-zinc-950 px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold active:translate-y-[1px] transition-all">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </header>

      <section className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Processing Velocity Area Chart */}
        <div className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl relative overflow-hidden h-[280px] flex flex-col justify-between">
          <div className="absolute inset-0 z-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 80, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGenerated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUploaded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(59,130,246,0.35)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="rgba(59,130,246,0.35)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="uploaded" stroke="rgba(59,130,246,0.35)" strokeWidth={2} fillOpacity={1} fill="url(#colorUploaded)" />
                <Area type="monotone" dataKey="generated" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorGenerated)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="relative z-10 p-6 flex justify-between items-start pointer-events-none">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary fill-primary/20" />
                <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">Live Engine Status</span>
              </div>
              <h3 className="font-cabinet text-3xl font-bold text-zinc-50">Content Pipeline Velocity</h3>
              <p className="text-sm text-muted-steel max-w-md mt-1">Videos generated vs successfully uploaded across all linked social media endpoints today.</p>
            </div>
            <div className="text-right">
              <div className="text-primary font-cabinet font-bold text-5xl tracking-tight">51<span className="text-3xl text-muted-steel/50">/55</span></div>
              <div className="text-[10px] text-muted-steel uppercase tracking-widest font-semibold mt-1">Upload Success Index</div>
            </div>
          </div>

          <div className="relative z-10 p-6 flex gap-6 mt-auto pointer-events-none">
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-zinc-50">Generated (55)</span>
            </div>
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-xs font-semibold text-muted-steel">Uploaded (51)</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[11px] text-muted-steel uppercase tracking-widest font-semibold mb-1">Total Assets Created</p>
              <p className="font-cabinet text-3xl font-bold text-zinc-50">12,482</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[11px] text-muted-steel uppercase tracking-widest font-semibold mb-1">Avg Engagement</p>
              <p className="font-cabinet text-3xl font-bold text-zinc-50">+24.8%</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[11px] text-muted-steel uppercase tracking-widest font-semibold mb-1">Tokens Consumed</p>
              <p className="font-cabinet text-3xl font-bold text-zinc-50">1.2M</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Recent Campaigns Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-end">
            <h4 className="font-cabinet text-2xl font-bold text-zinc-50">Recent Campaigns</h4>
            <Link to="/app/campaigns" className="text-sm font-semibold text-primary hover:text-white transition-colors">View All</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/app/campaigns" className="group block bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
              <div className="relative h-40 overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.1),transparent)]" />
                 <div className="absolute top-4 right-4 bg-primary/15 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                  TikTok
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h5 className="font-cabinet text-lg text-zinc-50 font-bold leading-tight">Cyberpunk Aesthetic v4.2</h5>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-steel font-medium">428 clips generated</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">Processing</span>
                </div>
              </div>
            </Link>

            <Link to="/app/campaigns" className="group block bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
              <div className="relative h-40 overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.1),transparent)]" />
                 <div className="absolute top-4 right-4 bg-primary/15 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                  Shorts
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h5 className="font-cabinet text-lg text-zinc-50 font-bold leading-tight">Tech Unboxing Series</h5>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-steel font-medium">89 clips</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">Active</span>
                </div>
              </div>
            </Link>

            <Link to="/app/campaigns" className="group block bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
              <div className="relative h-40 overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.1),transparent)]" />
                 <div className="absolute top-4 right-4 bg-primary/15 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                  Reels
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h5 className="font-cabinet text-lg text-zinc-50 font-bold leading-tight">Marketing Q3 Updates</h5>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-steel font-medium">12 clips</span>
                  <span className="px-2 py-1 bg-[rgba(255,255,255,0.1)] text-zinc-50 text-[10px] font-bold rounded uppercase tracking-wider">Completed</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
