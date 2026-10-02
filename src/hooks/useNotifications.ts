import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../lib/types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            setToast(newNotif);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== (payload.old as Notification).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const triggerSimulatedNotification = async () => {
    const randomScore = Math.floor(Math.random() * 15) + 85; // 85 to 99 score
    const viralityTopics = [
      'Mind-bending Hook on AI Automation',
      'Uncut Gem: High Engagement Speech Segment',
      'Viral Retention Peak (01:24 - 02:10)',
      'Top 1% Monetization Clip identified',
    ];
    const topic = viralityTopics[Math.floor(Math.random() * viralityTopics.length)];

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'demo-user';

    const newNotificationData = {
      user_id: userId,
      title: '🔥 High-Virality Clip Identified!',
      message: `${topic} with virality score of ${randomScore}/100 prepared for publishing.`,
      type: 'high_virality' as const,
      virality_score: randomScore,
      is_read: false,
    };

    if (user) {
      const { data, error: insertError } = await supabase
        .from('notifications')
        .insert(newNotificationData)
        .select()
        .single();

      if (!insertError && data) {
        // Realtime will pick this up automatically!
        return;
      }
    }

    // Local fallback for quick preview / demo mode
    const mockNotif: Notification = {
      id: `mock-${Date.now()}`,
      created_at: new Date().toISOString(),
      clip_id: null,
      ...newNotificationData,
    };

    setNotifications((prev) => [mockNotif, ...prev]);
    setToast(mockNotif);
  };

  const clearNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const dismissToast = () => setToast(null);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    toast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearNotification,
    triggerSimulatedNotification,
  };
}
