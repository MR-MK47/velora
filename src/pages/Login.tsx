import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate('/app');
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] flex items-center justify-center font-geist overflow-hidden text-on-surface">
      {/* Background Effects */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen" />

      {/* Main Container */}
      <main className="relative z-20 w-full max-w-[448px] px-6">
        {/* Logo Section */}
        <Link to="/" className="flex flex-col items-center mb-10 space-y-3 w-fit mx-auto group">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all">
            <Zap className="w-6 h-6 text-primary fill-primary/20 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-center">
            <h1 className="font-cabinet text-3xl font-bold tracking-tight text-zinc-50">Velora</h1>
            <p className="text-[10px] text-muted-steel uppercase tracking-[0.2em] font-semibold mt-1">Automation Engine</p>
          </div>
        </Link>

        {/* Auth Card */}
        <div className="bg-[#18181B]/80 backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)]">
          <div className="mb-8">
            <h2 className="font-cabinet text-2xl font-bold text-zinc-50 mb-1">System Access</h2>
            <p className="text-sm text-muted-steel">Enter credentials to proceed to the console.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant block">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="admin@velora.io" 
                    required
                  className="w-full h-11 pl-10 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-zinc-50 placeholder:text-muted-steel/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-on-surface-variant block">Access Password</label>
                <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    required
                  className="w-full h-11 pl-10 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-zinc-50 placeholder:text-muted-steel/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400/80 text-center">{error}</p>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-zinc-950 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 group hover:bg-white active:translate-y-[1px] transition-all animate-[pulse-cobalt_3s_cubic-bezier(0.4,0,0.6,1)_infinite] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Authenticating...' : 'Initialize Session'}</span>
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
            <div className="pt-4 text-center border-t border-[rgba(255,255,255,0.08)]">
              <p className="text-sm text-muted-steel">
                New to Velora?{' '}
                <Link to="/signup" className="text-primary font-medium hover:text-white transition-colors">
                  Request access
                </Link>
              </p>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-muted-steel shrink-0 mt-0.5" />
            <p className="text-xs text-muted-steel leading-relaxed">
              System Access Restricted. New accounts require Admin Role verification. IP logging is active for this session.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center items-center gap-4 text-xs font-semibold text-muted-steel">
          <Link to="/" className="hover:text-primary transition-colors">Return to Home</Link>
          <span className="w-1 h-1 rounded-full bg-muted-steel/30" />
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <span className="w-1 h-1 rounded-full bg-muted-steel/30" />
          <a href="#" className="hover:text-primary transition-colors">Privacy Protocol</a>
        </div>
      </main>
    </div>
  );
}
