import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  tenant_id: string;
  type: "rent_due" | "overdue" | "maintenance" | "agreement_expiry" | "announcement" | "payment_received" | "complaint_update" | "system";
  title: string;
  message?: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  channels: string[];
  sent_at?: string;
  read_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  tenant_id: string;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  frequency: "immediate" | "daily" | "weekly" | "never";
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  type?: Notification["type"];
  unread_only?: boolean;
  priority?: Notification["priority"];
  limit?: number;
  offset?: number;
}

export const useTenantNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get tenant profile ID
  const getTenantProfileId = async () => {
    if (!user?.id) return null;
    
    const { data: profile } = await supabase
      .from('tenants_profile')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return profile?.id;
  };

  // Fetch notifications for the current tenant
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["tenant-notifications", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return [];

      const { data, error } = await supabase
        .from('tenant_notifications' as any)
        .select('*')
        .eq('tenant_id', tenantProfileId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Notification[]) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get unread notification count
  const {
    data: unreadCount = 0,
    isLoading: unreadLoading,
  } = useQuery({
    queryKey: ["unread-notification-count", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return 0;

      const { data, error } = await supabase
        .from('tenant_notifications' as any)
        .select('id')
        .eq('tenant_id', tenantProfileId)
        .eq('is_read', false)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user?.id,
  });

  // Get notification preferences
  const {
    data: preferences = [],
    isLoading: preferencesLoading,
  } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return [];

      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('tenant_id', tenantProfileId);

      if (error) throw error;
      return (data as unknown as NotificationPreferences[]) || [];
    },
    enabled: !!user?.id,
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const { data, error } = await supabase
        .from('tenant_notifications' as any)
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('tenant_id', tenantProfileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const { data, error } = await supabase
        .rpc('mark_all_notifications_read' as any, {
          _tenant_id: tenantProfileId,
        } as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });

  // Update notification preferences
  const updatePreferences = useMutation({
    mutationFn: async (preferencesData: Partial<NotificationPreferences>[]) => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const updates = preferencesData.map(pref => ({
        tenant_id: tenantProfileId,
        ...pref,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .upsert(updates, {
          onConflict: 'tenant_id,notification_type',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const { error } = await supabase
        .from('tenant_notifications' as any)
        .delete()
        .eq('id', notificationId)
        .eq('tenant_id', tenantProfileId);

      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });

  // Create custom notification (for testing or admin use)
  const createNotification = useMutation({
    mutationFn: async (notificationData: {
      type: Notification["type"];
      title: string;
      message?: string;
      priority?: Notification["priority"];
      action_url?: string;
      action_text?: string;
      metadata?: Record<string, any>;
    }) => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const { data, error } = await supabase
        .rpc('create_notification' as any, {
          _tenant_id: tenantProfileId,
          _type: notificationData.type,
          _title: notificationData.title,
          _message: notificationData.message,
          _priority: notificationData.priority || 'normal',
          _action_url: notificationData.action_url,
          _action_text: notificationData.action_text,
          _metadata: notificationData.metadata,
        } as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });

  // Get filtered notifications
  const getFilteredNotifications = (filters: NotificationFilters) => {
    return useQuery({
      queryKey: ["tenant-notifications", user?.id, filters],
      queryFn: async () => {
        const tenantProfileId = await getTenantProfileId();
        if (!tenantProfileId) return [];

        let query = supabase
          .from('tenant_notifications' as any)
          .select('*')
          .eq('tenant_id', tenantProfileId)
          .or('expires_at.is.null,expires_at.gt.now()');

        // Apply filters
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.unread_only) {
          query = query.eq('is_read', false);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }

        query = query.order('created_at', { ascending: false });

        if (filters.limit) {
          query = query.limit(filters.limit);
        }
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      enabled: !!user?.id,
    });
  };

  // Get notification statistics
  const {
    data: notificationStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["notification-stats", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return null;

      const { data, error } = await supabase
        .from('tenant_notifications' as any)
        .select('type, priority, is_read, created_at')
        .eq('tenant_id', tenantProfileId)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) throw error;

      const stats = {
        total: (data as any)?.length || 0,
        unread: (data as any)?.filter((n: any) => !n.is_read).length || 0,
        urgent: (data as any)?.filter((n: any) => n.priority === 'urgent').length || 0,
        high: (data as any)?.filter((n: any) => n.priority === 'high').length || 0,
        by_type: {} as Record<string, number>,
        recent_24h: 0,
      };

      // Count by type
      (data as any)?.forEach((notification: any) => {
        stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;
        
        // Count recent notifications (last 24 hours)
        const createdAt = new Date(notification.created_at);
        const now = new Date();
        if (now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000) {
          stats.recent_24h++;
        }
      });

      return stats;
    },
    enabled: !!user?.id,
  });

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    unreadLoading,
    preferences,
    preferencesLoading,
    notificationStats,
    statsLoading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    deleteNotification,
    createNotification,
    getFilteredNotifications,
    refetchNotifications,
  };
};
