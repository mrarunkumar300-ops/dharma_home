import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Complaint {
  id: string;
  tenant_id: string;
  category: "electricity" | "water" | "cleaning" | "plumbing" | "carpentry" | "painting" | "pest_control" | "security" | "other";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "resolved" | "cancelled";
  image_urls: string[];
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface CreateComplaintData {
  category: Complaint["category"];
  title: string;
  description: string;
  priority: Complaint["priority"];
  image_urls?: string[];
}

export const useTenantComplaints = () => {
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

  // Fetch complaints for the current tenant
  const {
    data: complaints = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tenant-complaints", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return [];

      const { data, error } = await supabase
        .from('tenant_complaints' as any)
        .select('*')
        .eq('tenant_id', tenantProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Complaint[]) || [];
    },
    enabled: !!user?.id,
  });

  // Create a new complaint
  const createComplaint = useMutation({
    mutationFn: async (complaintData: CreateComplaintData) => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) throw new Error("Tenant profile not found");

      const { data, error } = await supabase
        .from('tenant_complaints' as any)
        .insert({
          tenant_id: tenantProfileId,
          ...complaintData,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-complaints-stats"] });
    },
  });

  // Update complaint status
  const updateComplaintStatus = useMutation({
    mutationFn: async ({ complaintId, status, resolutionNotes }: {
      complaintId: string;
      status: Complaint["status"];
      resolutionNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('tenant_complaints' as any)
        .update({
          status,
          resolution_notes: resolutionNotes,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-complaints-stats"] });
    },
  });

  // Get complaint details with comments
  const getComplaintDetails = (complaintId: string) => {
    return useQuery({
      queryKey: ["complaint-details", complaintId],
      queryFn: async () => {
        const { data: complaint, error: complaintError } = await supabase
          .from('tenant_complaints' as any)
          .select(`
            *,
            assigned_to_user:auth.users(id, email, raw_user_meta_data)
          `)
          .eq('id', complaintId)
          .single();

        if (complaintError) throw complaintError;

        const { data: comments, error: commentsError } = await supabase
          .from('complaint_comments' as any)
          .select(`
            *,
            user:auth.users(id, email, raw_user_meta_data)
          `)
          .eq('complaint_id', complaintId)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        return {
          complaint,
          comments: comments || [],
        };
      },
      enabled: !!complaintId,
    });
  };

  // Add comment to complaint
  const addComment = useMutation({
    mutationFn: async ({ complaintId, comment, isInternal = false }: {
      complaintId: string;
      comment: string;
      isInternal?: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('complaint_comments' as any)
        .insert({
          complaint_id: complaintId,
          user_id: user.id,
          comment,
          is_internal: isInternal,
        } as any)
        .select(`
          *,
          user:auth.users(id, email, raw_user_meta_data)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["complaint-details", variables.complaintId] });
    },
  });

  // Get complaint statistics
  const {
    data: complaintStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["tenant-complaints-stats", user?.id],
    queryFn: async () => {
      const tenantProfileId = await getTenantProfileId();
      if (!tenantProfileId) return null;

      const { data, error } = await supabase
        .from('tenant_complaints' as any)
        .select('status, priority, created_at, resolved_at')
        .eq('tenant_id', tenantProfileId);

      if (error) throw error;

      const stats = {
        total: (data as any)?.length || 0,
        pending: (data as any)?.filter((c: any) => c.status === 'pending').length || 0,
        in_progress: (data as any)?.filter((c: any) => c.status === 'in_progress').length || 0,
        resolved: (data as any)?.filter((c: any) => c.status === 'resolved').length || 0,
        urgent: (data as any)?.filter((c: any) => c.priority === 'urgent').length || 0,
        high: (data as any)?.filter((c: any) => c.priority === 'high').length || 0,
        average_resolution_time: 0,
      };

      // Calculate average resolution time in hours
      const resolvedComplaints = (data as any)?.filter((c: any) => c.status === 'resolved' && c.resolved_at);
      if (resolvedComplaints && resolvedComplaints.length > 0) {
        const totalHours = resolvedComplaints.reduce((sum: number, complaint: any) => {
          const created = new Date(complaint.created_at);
          const resolved = new Date(complaint.resolved_at!);
          return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        }, 0);
        stats.average_resolution_time = totalHours / resolvedComplaints.length;
      }

      return stats;
    },
    enabled: !!user?.id,
  });

  // Upload complaint images
  const uploadComplaintImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];

    for (const file of files) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `complaint-images/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-documents')
        .getPublicUrl(filePath);

      imageUrls.push(publicUrl);
    }

    return imageUrls;
  };

  return {
    complaints,
    isLoading,
    error,
    createComplaint,
    updateComplaintStatus,
    getComplaintDetails,
    addComment,
    complaintStats,
    statsLoading,
    uploadComplaintImages,
  };
};
