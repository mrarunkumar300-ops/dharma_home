import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export type Permission = 
  | "view_properties"
  | "create_properties" 
  | "edit_properties"
  | "delete_properties"
  | "view_tenants"
  | "create_tenants"
  | "edit_tenants" 
  | "delete_tenants"
  | "view_units"
  | "create_units"
  | "edit_units"
  | "delete_units"
  | "view_billing"
  | "create_billing"
  | "edit_billing"
  | "delete_billing"
  | "view_payments"
  | "create_payments"
  | "edit_payments"
  | "delete_payments"
  | "view_maintenance"
  | "create_maintenance"
  | "edit_maintenance"
  | "delete_maintenance"
  | "view_analytics"
  | "manage_users"
  | "manage_organization"
  | "view_settings"
  | "tenant_dashboard"
  | "tenant_profile"
  | "tenant_documents"
  | "tenant_family_members"
  | "tenant_bills"
  | "tenant_payments"
  | "staff_dashboard"
  | "staff_maintenance"
  | "staff_properties"
  | "user_dashboard"
  | "user_journey"
  | "user_properties"
  | "user_tenants"
  | "user_reports"
  | "user_operations"
  | "admin_dashboard"
  | "admin_users"
  | "admin_organization"
  | "admin_billing"
  | "admin_reports"
  | "admin_settings"
  | "manager_dashboard"
  | "manager_properties"
  | "manager_tenants"
  | "manager_reports"
  | "manager_settings"
  | "super_admin_dashboard"
  | "super_admin_users"
  | "super_admin_organizations"
  | "super_admin_subscriptions"
  | "super_admin_analytics"
  | "super_admin_database"
  | "super_admin_settings"
  | "guest_dashboard"
  | "guest_view_properties";

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    // Properties
    "view_properties", "create_properties", "edit_properties", "delete_properties",
    // Tenants
    "view_tenants", "create_tenants", "edit_tenants", "delete_tenants",
    // Units
    "view_units", "create_units", "edit_units", "delete_units",
    // Billing
    "view_billing", "create_billing", "edit_billing", "delete_billing",
    // Payments
    "view_payments", "create_payments", "edit_payments", "delete_payments",
    // Maintenance
    "view_maintenance", "create_maintenance", "edit_maintenance", "delete_maintenance",
    // Analytics
    "view_analytics",
    // Admin only
    "manage_users", "manage_organization", "view_settings",
    // Admin portal specific
    "admin_dashboard", "admin_users", "admin_organization", "admin_billing", "admin_reports", "admin_settings"
  ],
  manager: [
    // Properties
    "view_properties", "create_properties", "edit_properties",
    // Tenants
    "view_tenants", "create_tenants", "edit_tenants",
    // Units
    "view_units", "create_units", "edit_units",
    // Billing
    "view_billing", "create_billing", "edit_billing",
    // Payments
    "view_payments", "create_payments", "edit_payments",
    // Maintenance
    "view_maintenance", "create_maintenance", "edit_maintenance",
    // Analytics
    "view_analytics",
    // Limited settings
    "view_settings",
    // Manager portal specific
    "manager_dashboard", "manager_properties", "manager_tenants", "manager_reports", "manager_settings"
  ],
  user: [
    // Basic user permissions
    "view_properties", "view_tenants", "view_units", 
    "view_billing", "view_payments", "view_maintenance", 
    "view_analytics", "view_settings",
    // User portal specific permissions
    "user_dashboard", "user_journey", "user_properties", "user_tenants", "user_reports", "user_operations"
  ],
  tenant: [
    "tenant_dashboard", "tenant_profile", "tenant_documents", 
    "tenant_family_members", "tenant_bills", "tenant_payments"
  ],
  staff: [
    "staff_dashboard", "staff_maintenance", "staff_properties",
    "view_properties", "view_units", "view_maintenance",
    "create_maintenance", "edit_maintenance", "view_settings"
  ],
  guest: [
    "guest_dashboard", "guest_view_properties",
    "view_properties", "view_settings"
  ]
};

export const usePermissions = () => {
  const { profile } = useAuth();
  const { roles, isLoading: roleLoading } = useUserRole();

  // Fetch manually assigned permissions from user_permissions table
  const { data: manualPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["user-permissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from("user_permissions")
          .select("permission")
          .eq("user_id", profile.id);
        
        if (error) {
          console.error('Error fetching user permissions:', error);
          return [];
        }
        
        return (data || []).map(p => p.permission as Permission);
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
        return [];
      }
    },
    enabled: !!profile?.id,
  });

  const userPermissions = useMemo(() => {
    if (roleLoading || permissionsLoading) return [];
    
    // Get permissions from roles
    const roleBasedPermissions: Permission[] = [];
    roles.forEach(role => {
      if (rolePermissions[role]) {
        roleBasedPermissions.push(...rolePermissions[role]);
      }
    });
    
    // Combine role-based and manually assigned permissions
    // Manually assigned permissions are already included, just merge and deduplicate
    const allPermissions = [...new Set([...roleBasedPermissions, ...manualPermissions])];
    
    return allPermissions;
  }, [roles, roleLoading, manualPermissions, permissionsLoading]);

  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const canAccessRoute = (route: string): boolean => {
    const routePermissions: Record<string, Permission[]> = {
      "/": ["view_properties"],
      "/properties": ["view_properties"],
      "/tenants": ["view_tenants"],
      "/units": ["view_units"],
      "/billing": ["view_billing"],
      "/payments": ["view_payments"],
      "/maintenance": ["view_maintenance"],
      "/analytics": ["view_analytics"],
      "/settings": ["view_settings"]
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) return true;
    
    return hasAnyPermission(requiredPermissions);
  };

  return {
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isLoading: roleLoading || permissionsLoading,
    isAdmin: roles.includes("admin"),
    isManager: roles.includes("manager"),
    isUser: roles.includes("user"),
    isTenant: roles.includes("tenant"),
    isStaff: roles.includes("staff"),
    isGuest: roles.includes("guest")
  };
};
