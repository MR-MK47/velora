import { useState } from 'react';
import { Play, Copy, Share2, CloudDownload, Search, SlidersHorizontal, Zap, ArrowLeft, Globe, Video, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ExtractionModal from '../components/ExtractionModal';

type Network = 'TikTok' | 'YouTube Shorts' | 'Instagram Reels';

type VideoData = {
  id: string;
  title: string;
  score: number | null;
  time: string | null;
  description: string | null;
  status: 'Processed' | string;
  progress?: number;
  uploadedTo: Network[];
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  updated: string;
  totalVideos: number;
  videos: VideoData[];
};

const initialCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Project Aurora: Q4 Narrative',
    status: 'Active Campaign',
    updated: '2h ago',
    totalVideos: 4,
    videos: [
      { 
        id: 'v1',
        title: 'The Future of AI is at the Edge, Not Just the Cloud', 
        score: 94, 
        time: '00:42', 
        description: "Most people think AI is about the cloud, but the real revolution is happening at the edge. We are moving computation closer to data sources, eliminating latency and reducing bandwidth dependencies. This shift is fundamental to next-generation applications.", 
        status: 'Processed',
        uploadedTo: ['TikTok', 'YouTube Shorts']
      },
      { 
        id: 'v2',
        title: 'Cost-Efficiency in Scaling Infrastructure', 
        score: 88, 
        time: '00:15', 
        description: "If you're still manually rendering 4K assets, you're losing 70% of your operational margin. Automating pipelines frees up capital that can be reinvested into strategy rather than repetitive executions.", 
        status: 'Processed',
        uploadedTo: ['Instagram Reels']
      },
      { 
        id: 'v3',
        title: 'Narrative Hook 03', 
        score: null, 
        time: null, 
        description: null, 
        status: 'Rendering 42%', 
        progress: 42,
        uploadedTo: []
      },
      { 
        id: 'v4',
        title: 'Global Scale Strategy for Node Networks', 
        score: 97, 
        time: '00:58', 
        description: "The key isn't building more servers, it's building more intelligence into the edge nodes. A distributed architecture scales organically when each node can process logic autonomously.", 
        status: 'Processed',
        uploadedTo: ['TikTok', 'YouTube Shorts', 'Instagram Reels']
      },
    ]
  },
  {
    id: 'c2',
    name: 'Tech Unboxing Series',
    status: 'Completed',
    updated: '1d ago',
    totalVideos: 2,
    videos: [
      { 
        id: 't1',
        title: 'Unboxing the Quantum Core Processor', 
        score: 91, 
        time: '01:12', 
        description: "A first look at the new Quantum architecture. We explore the packaging, the heat spreaders, and the initial boot sequence. The raw processing power is unmatched in this form factor.", 
        status: 'Processed',
        uploadedTo: ['YouTube Shorts']
      },
      { 
        id: 't2',
        title: 'Thermal Performance Tests', 
        score: 85, 
        time: '00:45', 
        description: "Running stress tests to see how hot the new cores get under sustained load. The cooling solution is adequate, but enthusiasts will definitely want custom loops.", 
        status: 'Processed',
        uploadedTo: ['TikTok']
      }
    ]
  }
];

export default function CampaignWorkspace() {
  const [activeTab, setActiveTab] = useState('All Exports');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const tabs = ['All Exports', 'High Score', 'Drafts'];

  const selectedCampaign = initialCampaigns.find(c => c.id === selectedCampaignId);
  
  // Filter videos if a campaign is selected
  const displayVideos = selectedCampaign ? (
    activeTab === 'High Score' ? selectedCampaign.videos.filter(v => (v.score || 0) >= 90) :
    activeTab === 'Drafts' ? selectedCampaign.videos.filter(v => v.status !== 'Processed') :
    selectedCampaign.videos
  ) : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-deep-void relative">
      <ExtractionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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
                    <span className="text-muted-steel text-xs font-medium">• Updated {selectedCampaign.updated}</span>
                  </div>
                  <h2 className="font-cabinet text-3xl text-zinc-50 font-bold leading-none tracking-tight">{selectedCampaign.name}</h2>
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
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-primary text-zinc-950 font-bold rounded-lg hover:bg-white active:translate-y-[1px] transition-all"
          >
            <Zap className="w-4 h-4 fill-zinc-950" />
            New Campaign
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {!selectedCampaign ? (
        <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {initialCampaigns.map(campaign => (
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
                     {campaign.videos.length} Assets
                   </span>
                 </div>
                 <h3 className="text-xl font-cabinet font-bold text-zinc-50 mb-1">{campaign.name}</h3>
                 <div className="text-sm text-muted-steel mb-4">{campaign.status} • {campaign.updated}</div>
                 <div className="flex gap-2 text-xs font-semibold">
                    <span className="text-zinc-50">Manage Flow</span>
                    <ArrowLeft className="w-4 h-4 transform rotate-180 text-primary group-hover:translate-x-1 transition-transform" />
                 </div>
               </div>
             ))}
           </div>
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

          {/* Detailed Video List */}
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-6">
            <AnimatePresence>
              {displayVideos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-charcoal-ink border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden flex flex-col md:flex-row hover:border-primary/30 transition-all shadow-lg"
                >
                  {/* Video Thumbnail (Larger) */}
                  <div className="w-full md:w-64 h-48 md:h-auto bg-zinc-950 relative overflow-hidden flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.08)]">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent)]" />
                    
                    {video.status === 'Processed' ? (
                      <>
                        <Play className="w-12 h-12 text-primary/40 hover:scale-110 hover:text-primary transition-all duration-500 cursor-pointer" />
                        <div className="absolute top-3 left-3 flex justify-between items-end right-3">
                          <div className="bg-white px-2 py-0.5 rounded text-zinc-950 font-bold text-xs shadow-sm">
                            Score: {video.score}
                          </div>
                          <div className="bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-geist-mono">{video.time}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[rgba(255,255,255,0.1)]" />
                            <circle 
                              cx="32" cy="32" r="28" 
                              stroke="currentColor" 
                              strokeWidth="4" 
                              fill="transparent" 
                              strokeDasharray={28 * 2 * Math.PI} 
                              strokeDashoffset={28 * 2 * Math.PI - (28 * 2 * Math.PI * video.progress!) / 100}
                              className="text-primary transition-all duration-500" 
                            />
                          </svg>
                          <span className="absolute text-xs font-bold text-primary">{video.progress}%</span>
                        </div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{video.status}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Detailed Video Content */}
                  <div className="p-6 flex flex-col flex-1 bg-[#18181B]">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-zinc-50 font-semibold text-xl leading-snug max-w-[85%]">{video.title}</h3>
                       {video.status === 'Processed' && (
                         <span className="px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold rounded uppercase tracking-wider border border-[#22C55E]/20">
                           Ready
                         </span>
                       )}
                    </div>
                    
                    {video.description ? (
                      <div className="mb-6 flex-1">
                        <p className="text-[15px] text-muted-steel leading-relaxed">{video.description}</p>
                      </div>
                    ) : (
                      <div className="mb-6 flex-1 space-y-2 opacity-50 pt-2">
                         <div className="h-2.5 w-full bg-[rgba(255,255,255,0.1)] rounded animate-pulse" />
                         <div className="h-2.5 w-3/4 bg-[rgba(255,255,255,0.1)] rounded animate-pulse" />
                      </div>
                    )}
                    
                    {/* Social Media Logs & Actions */}
                    <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Social Integrations */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-steel font-bold">
                          <Globe className="w-3.5 h-3.5 mr-1.5" />
                          Endpoints:
                        </div>
                        {video.uploadedTo && video.uploadedTo.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {video.uploadedTo.map(network => (
                              <span key={network} className="px-2 py-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded text-xs text-zinc-50 font-medium flex items-center gap-1.5 hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-default">
                                {network === 'TikTok' && <div className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]" />}
                                {network === 'YouTube Shorts' && <div className="w-1.5 h-1.5 rounded-full bg-[#ff0000]" />}
                                {network === 'Instagram Reels' && <div className="w-1.5 h-1.5 rounded-full bg-[#E1306C]" />}
                                {network}
                                <ExternalLink className="w-3 h-3 text-muted-steel opacity-50" />
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-steel/50 italic">Pending uploads</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                         <button className="p-2 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-muted-steel hover:text-white" title="Copy Info">
                           <Copy className="w-4 h-4" />
                         </button>
                         <button 
                           disabled={video.status !== 'Processed'}
                           className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-semibold text-primary hover:bg-primary hover:text-zinc-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           <CloudDownload className="w-4 h-4" />
                           Download Assets
                         </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {displayVideos.length === 0 && (
              <div className="py-20 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-[rgba(255,255,255,0.01)]">
                <Video className="w-10 h-10 text-muted-steel mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold text-zinc-50 mb-1">No videos found</h3>
                <p className="text-muted-steel text-sm">No videos match the current filter criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
