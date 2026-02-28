import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("🔍 Fetching user roles for user:", user.id);
        
        // 🛡️ PRIMARY METHOD: Try direct query first
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        if (error) {
          console.error('❌ Error fetching user roles from database:', error);
          
          // 🛡️ FALLBACK 1: Check user metadata
          if (error.message?.includes('permission') || error.code === 'PGRST116') {
            console.log('🔄 Permission denied, checking user metadata');
            const userMetadata = user.user_metadata;
            if (userMetadata?.role) {
              console.log('✅ Found role in user metadata:', userMetadata.role);
              return [userMetadata.role];
            }
          }
          
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('✅ Found roles in database:', data.map(r => r.role));
          return data.map(r => r.role);
        } else {
          console.log('⚠️ No roles found in database for user:', user.id);
        }
        
        // 🛡️ FALLBACK 2: Check user metadata if no database roles
        const userMetadata = user.user_metadata;
        if (userMetadata?.role) {
          console.log('✅ Using fallback role from user metadata:', userMetadata.role);
          return [userMetadata.role];
        }
        
        // 🛡️ FINAL FALLBACK: Check signup_role in metadata
        if (userMetadata?.signup_role) {
          console.log('✅ Using fallback signup_role from user metadata:', userMetadata.signup_role);
          return [userMetadata.signup_role];
        }
        
        console.log('❌ No role found in any location for user:', user.id);
        return [];
      } catch (error) {
        console.error('❌ All role fetching methods failed:', error);
        
        // 🛡️ LAST RESORT: Check all possible metadata fields
        const userMetadata = user.user_metadata;
        const possibleRoles = [
          userMetadata?.role,
          userMetadata?.signup_role,
          userMetadata?.user_role
        ].filter(Boolean);
        
        if (possibleRoles.length > 0) {
          console.log('✅ Using last resort role from metadata:', possibleRoles[0]);
          return [possibleRoles[0]];
        }
        
        console.log('❌ No role found anywhere for user:', user.id);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 2, // Retry up to 2 times
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // 🛡️ SAFETY: Ensure roles is always an array and validate role values
  const rolesArray = Array.isArray(roles) ? roles : [];
  
  // 🛡️ VALIDATION: Only allow known valid roles
  const validRoles = ["super_admin", "admin", "manager", "user", "tenant", "staff", "guest"];
  const filteredRoles = rolesArray.filter(role => validRoles.includes(role));
  
  const isSuperAdmin = filteredRoles.includes("super_admin");
  const isAdmin = filteredRoles.includes("admin");
  const isManager = filteredRoles.includes("manager");
  const isUser = filteredRoles.includes("user");
  const isTenant = filteredRoles.includes("tenant");
  const isStaff = filteredRoles.includes("staff");
  const isGuest = filteredRoles.includes("guest");

  return { 
    roles: filteredRoles, 
    isSuperAdmin,
    isAdmin, 
    isManager, 
    isUser, 
    isTenant,
    isStaff,
    isGuest,
    isLoading,
    hasAnyRole: filteredRoles.length > 0
  };
};
