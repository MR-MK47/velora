import { useState, useEffect } from 'react';
import { User, Puzzle, Database, UploadCloud, ChevronRight, Eye, Key, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { storeSecret, getDecryptedSecret } from '../lib/vault';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('integrations');
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data, error }) => {
      if (error) { console.error('[Settings] Load error:', error); return; }
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(row => { map[row.key] = row.value; });
        setSettings(map);
      }
    });
  }, []);

  const triggerChange = () => setHasChanges(true);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-deep-void">
      {/* Header */}
      <header className="sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40 flex justify-between items-center px-8 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-steel">System</span>
          <ChevronRight className="w-4 h-4 text-muted-steel/50" />
          <span className="text-zinc-50 font-bold">Settings</span>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-xs font-medium ${saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`} data-save-message data-type={saveMessage.type}>
              {saveMessage.text}
            </span>
          )}
          <button 
            onClick={async () => {
              setSaving(true);
              setSaveMessage(null);

              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const sensitivePattern = /_key$|_secret$|_password$|service_account/;

                for (const el of document.querySelectorAll('input[data-key]')) {
                  const input = el as HTMLInputElement;
                  const key = input.dataset.key as string;
                  const value = input.value;

                  if (sensitivePattern.test(key)) {
                    await storeSecret(key, value);
                  } else {
                    await supabase.from('settings').upsert({
                      key,
                      value,
                      user_id: user.id,
                    }).select();
                  }
                }
                setHasChanges(false);
                setSaveMessage({ type: 'success', text: 'Settings saved successfully.' });
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to save settings';
                setSaveMessage({ type: 'error', text: message });
              } finally {
                setSaving(false);
              }
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300",
              hasChanges 
                ? "bg-primary text-zinc-950 animate-[pulse-cobalt_3s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:bg-white active:translate-y-[1px]" 
                : "bg-transparent border border-[rgba(255,255,255,0.15)] text-muted-steel hover:text-zinc-50 hover:border-[rgba(255,255,255,0.3)]"
            )}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12">
        {/* Left Navigation */}
        <aside className="space-y-6">
          <nav className="flex flex-col space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "flex items-center gap-4 px-4 py-3 text-left transition-colors border-l-2 group",
                activeTab === 'profile' 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-transparent text-muted-steel hover:text-zinc-50 hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              <User className={cn("w-5 h-5", activeTab === 'profile' ? "text-primary" : "group-hover:text-primary")} />
              <div>
                <div className="text-sm font-semibold">Profile</div>
                <div className="text-[11px] opacity-70">Account preferences</div>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={cn(
                "flex items-center gap-4 px-4 py-3 text-left transition-colors border-l-2 group",
                activeTab === 'integrations' 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-transparent text-muted-steel hover:text-zinc-50 hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              <Puzzle className={cn("w-5 h-5", activeTab === 'integrations' ? "text-primary" : "group-hover:text-primary")} />
              <div>
                <div className="text-sm font-semibold">Integrations</div>
                <div className="text-[11px] opacity-70">API & External Services</div>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('advanced')}
              className={cn(
                "flex items-center gap-4 px-4 py-3 text-left transition-colors border-l-2 group",
                activeTab === 'advanced' 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-transparent text-muted-steel hover:text-zinc-50 hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              <Database className={cn("w-5 h-5", activeTab === 'advanced' ? "text-primary" : "group-hover:text-primary")} />
              <div>
                <div className="text-sm font-semibold">Advanced</div>
                <div className="text-[11px] opacity-70">Database & Logs</div>
              </div>
            </button>
          </nav>

          {/* System Health */}
          <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hidden md:block">
            <h4 className="text-[10px] uppercase font-bold text-muted-steel mb-3 tracking-widest">System Health</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-muted-steel">API Status</span>
                <span className="text-primary">Operational</span>
              </div>
              <div className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                <div className="w-full h-full bg-primary" />
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="pb-12">
          {activeTab === 'integrations' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-2xl"
            >
              <div className="border-b border-[rgba(255,255,255,0.08)] pb-6">
                <h2 className="font-cabinet text-3xl font-bold text-zinc-50 mb-2">Integrations</h2>
                <p className="text-muted-steel text-sm leading-relaxed">Manage your connections to third-party providers and automation engines.</p>
              </div>

              {/* Supabase Config */}
              <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-[#3ECF8E]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-50">Supabase Configuration</h3>
                    <p className="text-xs text-muted-steel mt-0.5 font-medium">Vector storage and user authentication database</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-steel">Project URL</label>
                    <input 
                      type="text" 
                      placeholder="https://your-project.supabase.co"
                      data-key="supabase_url"
                      onChange={triggerChange}
                      className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg px-4 text-sm text-zinc-50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all font-geist-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-steel">Service Role API Key</label>
                    <div className="relative group">
                      <input 
                        type={revealedKeys['service_role_key'] ? 'text' : 'password'}
                        data-key="service_role_key"
                        defaultValue={settings['service_role_key'] || ''}
                        onChange={triggerChange}
                        className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg pl-4 pr-10 text-sm text-zinc-50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all font-geist-mono"
                      />
                      <button 
                        onClick={async () => {
                          const secretId = settings['service_role_key'];
                          if (secretId) {
                            try {
                              const plaintext = await getDecryptedSecret(secretId);
                              if (plaintext) {
                                setRevealedKeys(prev => ({ ...prev, service_role_key: plaintext }));
                              }
                            } catch (err) {
                              console.error('Failed to reveal secret:', err);
                            }
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-steel hover:text-zinc-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-steel italic">Never share this key. It bypasses Row Level Security.</p>
                  </div>
                </div>
              </div>

              {/* Gemini AI Config */}
              <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                     <Zap className="w-5 h-5 text-primary fill-primary/20" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-50">Gemini AI Model</h3>
                    <p className="text-xs text-muted-steel mt-0.5 font-medium">Large language model for automated video processing</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-steel">API Key</label>
                  <div className="relative group">
                    <input 
                      type={revealedKeys['gemini_key'] ? 'text' : 'password'}
                      data-key="gemini_key"
                      placeholder="Enter Gemini API Key..."
                      onChange={triggerChange}
                      className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg pl-4 pr-10 text-sm text-zinc-50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all font-geist-mono"
                    />
                    <button 
                      onClick={async () => {
                        const secretId = settings['gemini_key'];
                        if (secretId) {
                          try {
                            const plaintext = await getDecryptedSecret(secretId);
                            if (plaintext) {
                              setRevealedKeys(prev => ({ ...prev, gemini_key: plaintext }));
                            }
                          } catch (err) {
                            console.error('Failed to reveal secret:', err);
                          }
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-steel hover:text-zinc-50 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">Quotas: 60 RPM / 1M TPM</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Drive Service Account */}
              <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                      <UploadCloud className="w-5 h-5 text-muted-steel" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-50">Drive Service Account</h3>
                      <p className="text-xs text-muted-steel mt-0.5 font-medium">Upload credentials.json for storage automation</p>
                    </div>
                  </div>
                </div>

                <div className="w-full py-10 border-2 border-dashed border-[rgba(255,255,255,0.12)] rounded-xl bg-zinc-950/50 flex flex-col items-center justify-center group hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <UploadCloud className="w-8 h-8 text-muted-steel mb-3 group-hover:scale-110 group-hover:text-primary transition-transform" />
                  <p className="text-sm font-semibold text-zinc-50">Drag and drop your JSON credentials file here</p>
                  <p className="text-[10px] font-medium text-muted-steel mt-1 uppercase tracking-widest">Supported: .json from Google Cloud Console</p>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-steel">
              <p>This section is currently under development.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
