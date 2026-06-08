import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, User } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => navigate('/app'), 1500);
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] flex items-center justify-center font-geist overflow-hidden text-on-surface p-6">
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
      <main className="relative z-20 w-full max-w-[448px] mx-auto py-12">
        {/* Logo Section */}
        <Link to="/" className="flex flex-col items-center mb-8 space-y-3 group w-fit mx-auto">
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
            <h2 className="font-cabinet text-2xl font-bold text-zinc-50 mb-1">Request Access</h2>
            <p className="text-sm text-muted-steel">Create an account to initialize a workspace.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant block">First Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Admin" 
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-zinc-50 placeholder:text-muted-steel/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant block">Company</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Acme Corp" 
                    className="w-full h-11 pl-10 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-zinc-50 placeholder:text-muted-steel/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant block">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  placeholder="admin@velora.io" 
                  required
                  className="w-full h-11 pl-10 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-zinc-50 placeholder:text-muted-steel/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant block">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-steel group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  minLength={8}
                  className="w-full h-11 pl-10 pr-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-zinc-50 placeholder:text-muted-steel/50 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-2 bg-primary text-zinc-950 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 group hover:bg-white active:translate-y-[1px] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
            >
              <span>{isSubmitting ? 'Provisioning Workspace...' : 'Initialize Workspace'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <div className="pt-4 text-center border-t border-[rgba(255,255,255,0.08)]">
              <p className="text-sm text-muted-steel">
                Already have an instance?{' '}
                <Link to="/login" className="text-primary font-medium hover:text-white transition-colors">
                  Authenticate here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center items-center gap-4 text-xs font-semibold text-muted-steel">
          <Link to="/" className="hover:text-primary transition-colors">Return to Home</Link>
          <span className="w-1 h-1 rounded-full bg-muted-steel/30" />
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <span className="w-1 h-1 rounded-full bg-muted-steel/30" />
          <a href="#" className="hover:text-primary transition-colors">Privacy Protocol</a>
        </div>
      </main>
    </div>
  );
}
