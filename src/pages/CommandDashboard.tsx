import { Link } from 'react-router-dom';
import { Terminal, Plus, Video, TrendingUp, Database, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCampaigns } from '../hooks/useCampaigns';
import type { Campaign } from '../lib/types/database';

interface Stats {
  totalClips: number;
  doneClips: number;
  avgVirality: number;
  totalCampaigns: number;
}

export default function CommandDashboard() {
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [
          { count: totalClips },
          { count: doneClips },
          { data: viralityData },
        ] = await Promise.all([
          supabase.from('clips').select('id', { count: 'exact', head: true }),
          supabase.from('clips').select('id', { count: 'exact', head: true }).eq('status', 'done'),
          supabase.from('clips').select('virality_score').not('virality_score', 'is', null),
        ]);

        const scores = (viralityData || []).map((c: { virality_score: unknown }) => Number(c.virality_score) || 0);
        const avgVirality = scores.length > 0
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          : 0;

        setStats({
          totalClips: totalClips || 0,
          doneClips: doneClips || 0,
          avgVirality: Math.round(avgVirality * 10) / 10,
          totalCampaigns: 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const isLoading = campaignsLoading || statsLoading;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40 flex justify-between items-center px-8 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-primary" />
          <h2 className="font-cabinet text-xl font-bold text-zinc-50 tracking-tight">Command Dashboard</h2>
        </div>
        <Link to="/app/campaigns">
          <button className="bg-primary hover:bg-white text-zinc-950 px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold active:translate-y-[1px] transition-all">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </Link>
      </header>

      <section className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Processing Velocity Area Chart */}
        <div className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl relative overflow-hidden h-[280px] flex flex-col justify-between">
          <div className="absolute inset-0 z-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[]} margin={{ top: 80, right: 0, left: 0, bottom: 0 }}>
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
              <p className="text-sm text-muted-steel max-w-md mt-1">Videos generated vs successfully processed across all campaigns.</p>
            </div>
            <div className="text-right">
              <div className="text-primary font-cabinet font-bold text-5xl tracking-tight">
                {statsLoading ? '...' : (stats?.doneClips ?? 0)}
                <span className="text-3xl text-muted-steel/50">/{stats?.totalClips ?? 0}</span>
              </div>
              <div className="text-[10px] text-muted-steel uppercase tracking-widest font-semibold mt-1">Processed Index</div>
            </div>
          </div>

          <div className="relative z-10 p-6 flex gap-6 mt-auto pointer-events-none">
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-zinc-50">Total ({stats?.totalClips ?? 0})</span>
            </div>
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-xs font-semibold text-muted-steel">Done ({stats?.doneClips ?? 0})</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[11px] text-muted-steel uppercase tracking-widest font-semibold mb-1">Total Clips Created</p>
              <p className="font-cabinet text-3xl font-bold text-zinc-50">
                {isLoading ? <span className="animate-pulse">...</span> : stats?.totalClips ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[11px] text-muted-steel uppercase tracking-widest font-semibold mb-1">Avg Virality Score</p>
              <p className="font-cabinet text-3xl font-bold text-zinc-50">
                {isLoading ? <span className="animate-pulse">...</span> : stats ? `${stats.avgVirality}%` : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] p-5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
            <div>
              <p className="text-[11px] text-muted-steel uppercase tracking-widest font-semibold mb-1">Active Campaigns</p>
              <p className="font-cabinet text-3xl font-bold text-zinc-50">
                {isLoading ? <span className="animate-pulse">...</span> : campaigns.length}
              </p>
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3 animate-pulse">
                  <div className="h-32 bg-zinc-950 rounded-lg" />
                  <div className="h-5 w-3/4 bg-[rgba(255,255,255,0.1)] rounded" />
                  <div className="h-4 w-1/2 bg-[rgba(255,255,255,0.1)] rounded" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-[rgba(255,255,255,0.01)]">
              <Video className="w-10 h-10 text-muted-steel mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold text-zinc-50 mb-1">No campaigns yet</h3>
              <p className="text-muted-steel text-sm">Create your first campaign to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaigns.slice(0, 3).map((campaign: Campaign) => (
                <Link key={campaign.id} to="/app/campaigns" className="group block bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="relative h-40 overflow-hidden bg-zinc-950">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.1),transparent)]" />
                    <div className="absolute top-4 right-4 bg-primary/15 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                      {campaign.status}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h5 className="font-cabinet text-lg text-zinc-50 font-bold leading-tight">{campaign.title}</h5>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-steel font-medium">{campaign.created_at?.slice(0, 10)}</span>
                      <span className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
                        campaign.status === 'active' ? "bg-primary/10 text-primary" :
                        campaign.status === 'completed' ? "bg-[rgba(255,255,255,0.1)] text-zinc-50" :
                        "bg-[rgba(255,255,255,0.05)] text-muted-steel"
                      )}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
