import { useState } from 'react';
import { Play, Copy, CloudDownload, Search, SlidersHorizontal, Zap, ArrowLeft, Video, ExternalLink, Plus, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import ExtractionModal from '../components/ExtractionModal';
import CreateCampaignModal from '../components/CreateCampaignModal';
import ClipGrid from '../components/ClipGrid';
import { useCampaigns } from '../hooks/useCampaigns';
import { useClips } from '../hooks/useClips';
import type { Campaign, Clip } from '../lib/types/database';

export default function CampaignWorkspace() {
  const [activeTab, setActiveTab] = useState('All Exports');
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { campaigns, loading: campaignsLoading, refetch } = useCampaigns();
  const { clips, loading: clipsLoading } = useClips(selectedCampaignId || undefined);

  const tabs = ['All Exports', 'High Score', 'Drafts'];

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;

  const filteredClips = selectedCampaign ? (
    activeTab === 'High Score' ? clips.filter(c => (c.virality_score ?? 0) >= 75) :
    activeTab === 'Drafts' ? clips.filter(c => c.status !== 'done') :
    clips
  ) : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-deep-void relative">
      <ExtractionModal isOpen={isExtractModalOpen} onClose={() => setIsExtractModalOpen(false)} />
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(id) => { setSelectedCampaignId(id); refetch(); }}
      />

      {/* Header */}
      <header className={cn(
        "relative w-full shrink-0 border-b border-[rgba(255,255,255,0.08)] bg-zinc-950 flex flex-col justify-end p-8 overflow-hidden transition-all duration-300",
        selectedCampaign ? "min-h-[160px]" : "min-h-[220px]"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex justify-between items-end">
          {selectedCampaign ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-steel hover:text-white transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Campaigns
              </button>
              <div className="flex items-center gap-4 pt-1">
                <div className="w-16 h-16 rounded-xl border border-primary/50 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-charcoal-ink flex justify-center items-center shrink-0">
                   <Video className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider border border-primary/20">
                      {selectedCampaign.status}
                    </span>
                    <span className="text-muted-steel text-xs font-medium">
                      {clips.length} clip{clips.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h2 className="font-cabinet text-3xl text-zinc-50 font-bold leading-none tracking-tight">{selectedCampaign.title}</h2>
                  {selectedCampaign.campaign_brief && (
                    <p className="text-sm text-muted-steel mt-1 max-w-lg line-clamp-1">{selectedCampaign.campaign_brief}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-6">
              <div className="pb-2">
                <h2 className="font-cabinet text-5xl text-zinc-50 font-bold leading-tight tracking-tight">Campaign Workspace</h2>
                <p className="text-muted-steel mt-2 text-lg">Manage and monitor all automation pipelines.</p>
              </div>
            </div>
          )}

          {selectedCampaign ? (
            <button
              onClick={() => setIsExtractModalOpen(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-lg hover:bg-white active:translate-y-[1px] transition-all"
            >
              <Wand2 className="w-4 h-4" />
              Create Clips
            </button>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-lg hover:bg-white active:translate-y-[1px] transition-all"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {!selectedCampaign ? (
        <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
          {campaignsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-4 animate-pulse">
                  <div className="h-12 w-12 bg-[rgba(255,255,255,0.1)] rounded-lg" />
                  <div className="h-6 w-3/4 bg-[rgba(255,255,255,0.1)] rounded" />
                  <div className="h-4 w-1/2 bg-[rgba(255,255,255,0.1)] rounded" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-[rgba(255,255,255,0.01)]">
              <Video className="w-10 h-10 text-muted-steel mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold text-zinc-50 mb-1">No campaigns yet</h3>
              <p className="text-muted-steel text-sm">Create one to get started!</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-lg hover:bg-white active:translate-y-[1px] transition-all"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign: Campaign) => {
                const clipsCount = 0;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl p-6 hover:border-primary/50 hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                        <Video className="w-6 h-6 text-muted-steel group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                        {clipsCount} Assets
                      </span>
                    </div>
                    <h3 className="text-xl font-cabinet font-bold text-zinc-50 mb-1">{campaign.title}</h3>
                    {campaign.campaign_brief && (
                      <p className="text-sm text-muted-steel mb-2 line-clamp-2">{campaign.campaign_brief}</p>
                    )}
                    <div className="text-sm text-muted-steel mb-4 capitalize">{campaign.status}</div>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="text-zinc-50">Manage Flow</span>
                      <ArrowLeft className="w-4 h-4 transform rotate-180 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filters for Selected Campaign */}
          <div className="px-8 py-4 bg-charcoal-ink border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center sticky top-0 z-30">
            <div className="flex gap-6 relative">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-2 text-sm font-medium transition-colors relative",
                    activeTab === tab ? "text-primary" : "text-muted-steel hover:text-on-surface"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search clips..."
                  className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all w-64"
                />
              </div>
              <button className="p-2 border border-[rgba(255,255,255,0.08)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-muted-steel transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clip Grid */}
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            <ClipGrid
              clips={filteredClips}
              loading={clipsLoading}
              emptyMessage="No clips in this campaign"
              onOpenEditor={(id) => console.log('Open editor', id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
