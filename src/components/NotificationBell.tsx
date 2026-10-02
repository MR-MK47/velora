import { useState, useRef, useEffect } from 'react';
import { Bell, Flame, CheckCheck, Sparkles, X, Zap, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    toast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearNotification,
    triggerSimulatedNotification,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notifId: string) => {
    markAsRead(notifId);
    setIsOpen(false);
    navigate('/app/campaigns');
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Toast Banner for live notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-[200] max-w-sm w-full bg-charcoal-ink/95 border border-amber-500/40 rounded-xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.25)] backdrop-blur-xl flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { dismissToast(); navigate('/app/campaigns'); }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">High Virality Alert</span>
                  <span className="text-[10px] text-muted-steel">Just now</span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-100 mt-0.5 truncate">{toast.title}</h4>
                <p className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">{toast.message}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  <span>View in Campaigns</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
              <button
                onClick={dismissToast}
                className="text-muted-steel hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Animated progress bar for auto dismiss */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6, ease: 'linear' }}
              className="h-0.5 bg-amber-400/80 -mx-4 -mb-4 mt-2"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center",
          isOpen
            ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            : "bg-charcoal-ink/80 border-[rgba(255,255,255,0.08)] text-muted-steel hover:text-zinc-100 hover:bg-white/5"
        )}
        title="Real-time Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-[10px] font-bold text-zinc-950 items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-charcoal-ink/95 border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-[100] overflow-hidden flex flex-col max-h-[520px]"
          >
            {/* Dropdown Header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-cabinet font-bold text-sm text-zinc-50">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-muted-steel hover:text-primary flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Read all
                  </button>
                )}
              </div>
            </div>

            {/* Test Trigger Banner */}
            <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Test Realtime Engine:</span>
              <button
                onClick={triggerSimulatedNotification}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold rounded-lg transition-all text-[11px] active:scale-95 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                Trigger High Virality Clip
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-muted-steel">
                  <Bell className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                  <p className="text-xs font-medium text-zinc-400">No notifications yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-[220px]">
                    Real-time alerts will trigger when high virality clips are ready for publishing.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-4 flex items-start gap-3 transition-colors relative group hover:bg-white/[0.04]",
                      !notif.is_read ? "bg-primary/[0.04]" : ""
                    )}
                  >
                    {/* Icon based on virality score */}
                    <div
                      onClick={() => handleNotificationClick(notif.id)}
                      className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notif.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-zinc-200 group-hover:text-primary transition-colors truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-steel shrink-0">
                          {formatTimestamp(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-steel mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.virality_score != null && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Virality: {notif.virality_score}/100
                          </span>
                          <span className="text-[11px] text-primary/80 group-hover:text-primary font-medium flex items-center gap-1">
                            View Clips <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-steel hover:text-red-400 hover:bg-white/10 rounded-md transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-zinc-950/90 text-center">
              <span className="text-[10px] text-muted-steel tracking-wide uppercase font-mono">
                Supabase Realtime Channel Active • PostgreSQL Listening
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
