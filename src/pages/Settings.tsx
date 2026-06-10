import { useState, useEffect, type ElementType } from 'react';
import { User, Puzzle, Database, UploadCloud, ChevronRight, Eye, Key, Zap, LogOut, Trash2, RefreshCw, Shield, Clock, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { storeSecret, getDecryptedSecret } from '../lib/vault';
import { useNavigate } from 'react-router-dom';
import type { User as SupaUser } from '@supabase/supabase-js';

type SettingsTab = 'profile' | 'integrations' | 'advanced';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [user, setUser] = useState<SupaUser | null>(null);

  const [profileName, setProfileName] = useState('');
  const [profileNameDirty, setProfileNameDirty] = useState(false);

  const revealedKeys = useRevealedKeys();
  const settingsForm = useSettingsForm();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (profileNameDirty && profileName.trim()) {
        await supabase.from('settings').upsert({
          key: 'display_name',
          value: profileName.trim(),
          user_id: user.id,
        }, { onConflict: 'user_id,key' });
      }

      for (const [key, value] of Object.entries<string>(settingsForm.dirty)) {
        if (!value) continue;
        const sensitivePattern = /_key$|_secret$|_password$|service_account/;
        if (sensitivePattern.test(key)) {
          await storeSecret(key, value);
        } else {
          await supabase.from('settings').upsert({
            key,
            value,
            user_id: user.id,
          }, { onConflict: 'user_id,key' });
        }
      }

      settingsForm.clearDirty();
      setProfileNameDirty(false);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setSaveMessage({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const hasChanges = profileNameDirty || settingsForm.hasDirty;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-deep-void">
      <header className="sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40 flex justify-between items-center px-8 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-steel">System</span>
          <ChevronRight className="w-4 h-4 text-muted-steel/50" />
          <span className="text-zinc-50 font-bold">Settings</span>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={cn('text-xs font-medium', saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={handleSave}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300',
              hasChanges
                ? 'bg-primary text-zinc-950 hover:bg-white active:translate-y-[1px]'
                : 'bg-transparent border border-[rgba(255,255,255,0.15)] text-muted-steel hover:text-zinc-50 hover:border-[rgba(255,255,255,0.3)]'
            )}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12">
        <aside className="space-y-6">
          <nav className="flex flex-col space-y-1">
            <TabButton icon={User} label="Profile" desc="Account preferences" tab="profile" activeTab={activeTab} onSelect={setActiveTab} />
            <TabButton icon={Puzzle} label="Integrations" desc="API & External Services" tab="integrations" activeTab={activeTab} onSelect={setActiveTab} />
            <TabButton icon={Database} label="Advanced" desc="Database & Logs" tab="advanced" activeTab={activeTab} onSelect={setActiveTab} />
          </nav>

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

        <section className="pb-12">
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              profileName={profileName}
              onProfileNameChange={(v) => { setProfileName(v); setProfileNameDirty(true); }}
              onSignOut={handleSignOut}
            />
          )}
          {activeTab === 'integrations' && (
            <IntegrationsTab
              settingsForm={settingsForm}
              revealedKeys={revealedKeys}
            />
          )}
          {activeTab === 'advanced' && <AdvancedTab />}
        </section>
      </div>
    </div>
  );
}

/* ─── Tab Button ─── */

function TabButton({ icon: Icon, label, desc, tab, activeTab, onSelect }: {
  icon: ElementType;
  label: string;
  desc: string;
  tab: SettingsTab;
  activeTab: SettingsTab;
  onSelect: (t: SettingsTab) => void;
}) {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => onSelect(tab)}
      className={cn(
        'flex items-center gap-4 px-4 py-3 text-left transition-colors border-l-2 group',
        isActive
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-transparent text-muted-steel hover:text-zinc-50 hover:bg-[rgba(255,255,255,0.03)]'
      )}
    >
      <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'group-hover:text-primary')} />
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] opacity-70">{desc}</div>
      </div>
    </button>
  );
}

/* ─── Profile Tab ─── */

function ProfileTab({ user, profileName, onProfileNameChange, onSignOut }: {
  user: SupaUser | null;
  profileName: string;
  onProfileNameChange: (v: string) => void;
  onSignOut: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-6">
        <h2 className="font-cabinet text-3xl font-bold text-zinc-50 mb-2">Profile</h2>
        <p className="text-muted-steel text-sm leading-relaxed">Manage your account preferences and personal information.</p>
      </div>

      <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">{user?.email || 'User'}</h3>
            <p className="text-xs text-muted-steel mt-0.5 font-medium">Signed in</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-steel">Display Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => onProfileNameChange(e.target.value)}
              placeholder="Enter your display name..."
              className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg px-4 text-sm text-zinc-50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-steel">Email</label>
            <div className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg px-4 flex items-center text-sm text-zinc-50 font-geist-mono">
              {user?.email || '—'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-steel">User ID</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg px-4 flex items-center text-sm text-zinc-50 font-geist-mono truncate">
                {user?.id || '—'}
              </div>
              <button
                onClick={() => {
                  if (user?.id) {
                    navigator.clipboard.writeText(user.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="p-2 border border-[rgba(255,255,255,0.1)] rounded-lg text-muted-steel hover:text-zinc-50 transition-colors"
                title="Copy User ID"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-steel">Last Sign In</label>
            <div className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg px-4 flex items-center text-sm text-zinc-50">
              <Clock className="w-3.5 h-3.5 text-muted-steel mr-2" />
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-red-500/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <LogOut className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-base font-bold text-zinc-50">Sign Out</h3>
            <p className="text-xs text-muted-steel mt-0.5">End your current session and return to the login page.</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="px-5 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Integrations Tab ─── */

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  hint?: string;
}

const INTEGRATION_GROUPS = [
  {
    title: 'Supabase Configuration',
    icon: Database,
    iconBg: 'bg-[#3ECF8E]/10 border-[#3ECF8E]/20',
    iconColor: 'text-[#3ECF8E]',
    desc: 'Vector storage and user authentication database',
    fields: [
      { key: 'supabase_url', label: 'Project URL', placeholder: 'https://your-project.supabase.co', type: 'text' as const },
      { key: 'service_role_key', label: 'Service Role API Key', placeholder: 'Enter service role key...', type: 'password' as const, hint: 'Never share this key. It bypasses Row Level Security.' },
    ],
  },
  {
    title: 'Gemini AI Model',
    icon: Zap,
    iconBg: 'bg-primary/10 border-primary/20',
    iconColor: 'text-primary',
    desc: 'Large language model for automated video processing',
    fields: [
      { key: 'gemini_key', label: 'API Key', placeholder: 'Enter Gemini API Key...', type: 'password' as const },
    ],
    badge: { text: 'Quotas: 60 RPM / 1M TPM', color: '#F59E0B' },
  },
];

function IntegrationsTab({ settingsForm, revealedKeys }: {
  settingsForm: ReturnType<typeof useSettingsForm>;
  revealedKeys: ReturnType<typeof useRevealedKeys>;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-6">
        <h2 className="font-cabinet text-3xl font-bold text-zinc-50 mb-2">Integrations</h2>
        <p className="text-muted-steel text-sm leading-relaxed">Manage your connections to third-party providers and automation engines.</p>
      </div>

      {INTEGRATION_GROUPS.map((group) => (
        <div key={group.title} className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', group.iconBg)}>
              <group.icon className={cn('w-5 h-5', group.iconColor, group.icon === Zap && 'fill-primary/20')} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-50">{group.title}</h3>
              <p className="text-xs text-muted-steel mt-0.5 font-medium">{group.desc}</p>
            </div>
          </div>

          <div className="space-y-4">
            {group.fields.map((field) => (
              <div key={field.key}>
              <SettingsField
                field={field}
                value={settingsForm.values[field.key] || ''}
                isRevealed={revealedKeys[field.key] || false}
                hasExistingSecret={!!settingsForm.existingSecrets[field.key]}
                onChange={(v) => settingsForm.setField(field.key, v)}
                onReveal={async () => {
                  const secretId = settingsForm.existingSecrets[field.key];
                  if (secretId) {
                    try {
                      const plaintext = await getDecryptedSecret(secretId);
                      if (plaintext) {
                        revealedKeys.reveal(field.key, plaintext);
                        settingsForm.setField(field.key, plaintext);
                      }
                    } catch (err) {
                      console.error('Failed to reveal secret:', err);
                    }
                  }
                }}
              />
              </div>
            ))}
          </div>

          {group.badge && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">{group.badge.text}</span>
              </span>
            </div>
          )}
        </div>
      ))}

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
  );
}

function SettingsField({ field, value, isRevealed, hasExistingSecret, onChange, onReveal }: {
  field: IntegrationField;
  value: string;
  isRevealed: boolean;
  hasExistingSecret: boolean;
  onChange: (v: string) => void;
  onReveal: () => void;
}) {
  const inputType = field.type === 'password' && !isRevealed ? 'password' : 'text';
  const showPlaceholder = field.type === 'password' && hasExistingSecret && !value && !isRevealed;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-muted-steel">{field.label}</label>
      <div className="relative group">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={showPlaceholder ? '••••••••' : field.placeholder}
          className="w-full h-10 bg-zinc-950 border border-[rgba(255,255,255,0.1)] rounded-lg pl-4 pr-10 text-sm text-zinc-50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all font-geist-mono placeholder:text-muted-steel/40"
        />
        {field.type === 'password' && (
          <button
            onClick={onReveal}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-steel hover:text-zinc-50 transition-colors"
            title={isRevealed ? 'Revealed' : 'Reveal secret'}
          >
            {isRevealed ? <Key className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {field.hint && <p className="text-[11px] text-muted-steel italic">{field.hint}</p>}
    </div>
  );
}

/* ─── Advanced Tab ─── */

function AdvancedTab() {
  const [clearing, setClearing] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-6">
        <h2 className="font-cabinet text-3xl font-bold text-zinc-50 mb-2">Advanced</h2>
        <p className="text-muted-steel text-sm leading-relaxed">Database management, logs, and system configuration.</p>
      </div>

      <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Database Connection</h3>
            <p className="text-xs text-muted-steel mt-0.5 font-medium">Supabase PostgreSQL instance</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 px-3 bg-zinc-950 rounded-lg border border-[rgba(255,255,255,0.05)]">
            <span className="text-sm text-muted-steel">Project</span>
            <span className="text-sm text-zinc-50 font-geist-mono">iunsqsfbhcxgodtogszd</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-zinc-950 rounded-lg border border-[rgba(255,255,255,0.05)]">
            <span className="text-sm text-muted-steel">Region</span>
            <span className="text-sm text-zinc-50">US East (N. Virginia)</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-zinc-950 rounded-lg border border-[rgba(255,255,255,0.05)]">
            <span className="text-sm text-muted-steel">Auth Schema</span>
            <span className="text-sm text-zinc-50 font-geist-mono">auth.users</span>
          </div>
        </div>
      </div>

      <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-muted-steel" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-50">Cache & State</h3>
            <p className="text-xs text-muted-steel mt-0.5 font-medium">Client-side data management</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          className="px-5 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm font-semibold text-muted-steel hover:text-zinc-50 hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        >
          Clear Local Cache & Reload
        </button>
      </div>

      <div className="bg-[#18181B] bg-opacity-60 backdrop-blur-md border border-red-500/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-base font-bold text-zinc-50">Danger Zone</h3>
            <p className="text-xs text-muted-steel mt-0.5">Irreversible actions — proceed with caution.</p>
          </div>
        </div>
        <button
          disabled={clearing}
          onClick={async () => {
            if (!window.confirm('Are you sure you want to clear all your campaign data? This cannot be undone.')) return;
            setClearing(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('clips').delete().eq('user_id', user.id);
              await supabase.from('campaigns').delete().eq('user_id', user.id);
              setClearing(false);
              window.location.reload();
            } catch {
              setClearing(false);
            }
          }}
          className="px-5 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {clearing ? 'Clearing...' : 'Clear All Campaign Data'}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Hooks ─── */

function useRevealedKeys() {
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  return {
    ...revealed,
    reveal: (key: string, value: string) => setRevealed((prev) => ({ ...prev, [key]: value })),
  };
}

function useSettingsForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [existingSecrets, setExistingSecrets] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data, error }) => {
      if (error) { console.error('[Settings] Load error:', error); return; }
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row) => { map[row.key] = row.value; });
        setValues(map);
        // Track which keys have Vault secret IDs stored
        const secrets: Record<string, string> = {};
        data.forEach((row) => {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.value);
          if (isUUID && (row.key.endsWith('_key') || row.key.endsWith('_secret') || row.key.endsWith('_password'))) {
            secrets[row.key] = row.value;
          }
        });
        setExistingSecrets(secrets);
      }
    });
  }, []);

  return {
    values,
    dirty,
    existingSecrets,
    hasDirty: Object.keys(dirty).length > 0,
    setField: (key: string, value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      if (value) {
        setDirty((prev) => ({ ...prev, [key]: value }));
      } else {
        setDirty((prev) => { const { [key]: _, ...rest } = prev; return rest; });
      }
    },
    clearDirty: () => setDirty({}),
  };
}
