import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Shield, Loader2, Zap, Eye, Wrench, Crown, ShieldCheck, BookOpen, Eraser, Info } from "lucide-react";
import { Permission } from "@/hooks/usePermissions";

const ALL_PERMISSION_KEYS: Permission[] = [
  "view_properties", "create_properties", "edit_properties", "delete_properties",
  "view_tenants", "create_tenants", "edit_tenants", "delete_tenants",
  "view_units", "create_units", "edit_units", "delete_units",
  "view_billing", "create_billing", "edit_billing", "delete_billing",
  "view_payments", "create_payments", "edit_payments", "delete_payments",
  "view_maintenance", "create_maintenance", "edit_maintenance", "delete_maintenance",
  "view_analytics", "manage_users", "manage_organization", "view_settings",
  "tenant_dashboard", "tenant_profile", "tenant_documents", "tenant_family_members", "tenant_bills", "tenant_payments",
  "staff_dashboard", "staff_maintenance", "staff_properties",
  "user_dashboard", "user_journey", "user_properties", "user_tenants", "user_reports", "user_operations",
  "admin_dashboard", "admin_users", "admin_organization", "admin_billing", "admin_reports", "admin_settings",
  "manager_dashboard", "manager_properties", "manager_tenants", "manager_reports", "manager_settings",
  "super_admin_dashboard", "super_admin_users", "super_admin_organizations", "super_admin_subscriptions", "super_admin_analytics", "super_admin_database", "super_admin_settings",
  "guest_dashboard", "guest_view_properties",
];

// Role-based default permissions (mirrors usePermissions hook)
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    "view_properties", "create_properties", "edit_properties", "delete_properties",
    "view_tenants", "create_tenants", "edit_tenants", "delete_tenants",
    "view_units", "create_units", "edit_units", "delete_units",
    "view_billing", "create_billing", "edit_billing", "delete_billing",
    "view_payments", "create_payments", "edit_payments", "delete_payments",
    "view_maintenance", "create_maintenance", "edit_maintenance", "delete_maintenance",
    "view_analytics", "manage_users", "manage_organization", "view_settings",
    "admin_dashboard", "admin_users", "admin_organization", "admin_billing", "admin_reports", "admin_settings",
  ],
  manager: [
    "view_properties", "create_properties", "edit_properties",
    "view_tenants", "create_tenants", "edit_tenants",
    "view_units", "create_units", "edit_units",
    "view_billing", "create_billing", "edit_billing",
    "view_payments", "create_payments", "edit_payments",
    "view_maintenance", "create_maintenance", "edit_maintenance",
    "view_analytics", "view_settings",
    "manager_dashboard", "manager_properties", "manager_tenants", "manager_reports", "manager_settings",
  ],
  user: [
    "view_properties", "create_properties", "edit_properties",
    "view_tenants", "create_tenants", "edit_tenants",
    "view_units", "create_units", "edit_units",
    "view_billing", "create_billing", "edit_billing",
    "view_payments", "create_payments", "edit_payments",
    "view_maintenance", "create_maintenance", "edit_maintenance",
    "view_analytics", "view_settings",
    "user_dashboard", "user_journey", "user_properties", "user_tenants", "user_reports", "user_operations",
  ],
  tenant: [
    "tenant_dashboard", "tenant_profile", "tenant_documents",
    "tenant_family_members", "tenant_bills", "tenant_payments",
  ],
  staff: [
    "staff_dashboard", "staff_maintenance", "staff_properties",
    "view_properties", "view_units", "view_maintenance",
    "create_maintenance", "edit_maintenance", "view_settings",
  ],
};

const PERMISSION_TEMPLATES: { name: string; icon: React.ReactNode; description: string; permissions: Permission[]; color: string }[] = [
  {
    name: "Full Access",
    icon: <Crown className="w-4 h-4" />,
    description: "All permissions enabled",
    color: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    permissions: [...ALL_PERMISSION_KEYS],
  },
  {
    name: "Read Only",
    icon: <Eye className="w-4 h-4" />,
    description: "View-only across all modules",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
    permissions: ["view_properties", "view_tenants", "view_units", "view_billing", "view_payments", "view_maintenance", "view_analytics", "view_settings"],
  },
  {
    name: "Maintenance Only",
    icon: <Wrench className="w-4 h-4" />,
    description: "Maintenance + property viewing",
    color: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
    permissions: ["view_maintenance", "create_maintenance", "edit_maintenance", "view_properties", "view_units", "view_settings"],
  },
  {
    name: "Manager",
    icon: <ShieldCheck className="w-4 h-4" />,
    description: "Full CRUD without delete or admin",
    color: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
    permissions: [
      "view_properties", "create_properties", "edit_properties",
      "view_tenants", "create_tenants", "edit_tenants",
      "view_units", "create_units", "edit_units",
      "view_billing", "create_billing", "edit_billing",
      "view_payments", "create_payments", "edit_payments",
      "view_maintenance", "create_maintenance", "edit_maintenance",
      "view_analytics", "view_settings",
    ],
  },
  {
    name: "Tenant Portal",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Tenant dashboard & self-service",
    color: "bg-accent/50 text-accent-foreground border-accent/30 hover:bg-accent/70",
    permissions: ["tenant_dashboard", "tenant_profile", "tenant_documents", "tenant_family_members", "tenant_bills", "tenant_payments"],
  },
  {
    name: "Clear All",
    icon: <Eraser className="w-4 h-4" />,
    description: "Remove all permissions",
    color: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
    permissions: [],
  },
];

const ALL_PERMISSIONS: { category: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    category: "Properties",
    permissions: [
      { key: "view_properties", label: "View Properties" },
      { key: "create_properties", label: "Create Properties" },
      { key: "edit_properties", label: "Edit Properties" },
      { key: "delete_properties", label: "Delete Properties" },
    ],
  },
  {
    category: "Tenants",
    permissions: [
      { key: "view_tenants", label: "View Tenants" },
      { key: "create_tenants", label: "Create Tenants" },
      { key: "edit_tenants", label: "Edit Tenants" },
      { key: "delete_tenants", label: "Delete Tenants" },
    ],
  },
  {
    category: "Units",
    permissions: [
      { key: "view_units", label: "View Units" },
      { key: "create_units", label: "Create Units" },
      { key: "edit_units", label: "Edit Units" },
      { key: "delete_units", label: "Delete Units" },
    ],
  },
  {
    category: "Billing",
    permissions: [
      { key: "view_billing", label: "View Billing" },
      { key: "create_billing", label: "Create Billing" },
      { key: "edit_billing", label: "Edit Billing" },
      { key: "delete_billing", label: "Delete Billing" },
    ],
  },
  {
    category: "Payments",
    permissions: [
      { key: "view_payments", label: "View Payments" },
      { key: "create_payments", label: "Create Payments" },
      { key: "edit_payments", label: "Edit Payments" },
      { key: "delete_payments", label: "Delete Payments" },
    ],
  },
  {
    category: "Maintenance",
    permissions: [
      { key: "view_maintenance", label: "View Maintenance" },
      { key: "create_maintenance", label: "Create Maintenance" },
      { key: "edit_maintenance", label: "Edit Maintenance" },
      { key: "delete_maintenance", label: "Delete Maintenance" },
    ],
  },
  {
    category: "Administration",
    permissions: [
      { key: "view_analytics", label: "View Analytics" },
      { key: "manage_users", label: "Manage Users" },
      { key: "manage_organization", label: "Manage Organization" },
      { key: "view_settings", label: "View Settings" },
    ],
  },
  {
    category: "Tenant Portal",
    permissions: [
      { key: "tenant_dashboard", label: "Tenant Dashboard" },
      { key: "tenant_profile", label: "Tenant Profile" },
      { key: "tenant_documents", label: "Tenant Documents" },
      { key: "tenant_family_members", label: "Tenant Family Members" },
      { key: "tenant_bills", label: "Tenant Bills" },
      { key: "tenant_payments", label: "Tenant Payments" },
    ],
  },
  {
    category: "Admin Portal",
    permissions: [
      { key: "admin_dashboard", label: "Admin Dashboard" },
      { key: "admin_users", label: "Admin Users" },
      { key: "admin_organization", label: "Admin Organization" },
      { key: "admin_billing", label: "Admin Billing" },
      { key: "admin_reports", label: "Admin Reports" },
      { key: "admin_settings", label: "Admin Settings" },
    ],
  },
  {
    category: "Manager Portal",
    permissions: [
      { key: "manager_dashboard", label: "Manager Dashboard" },
      { key: "manager_properties", label: "Manager Properties" },
      { key: "manager_tenants", label: "Manager Tenants" },
      { key: "manager_reports", label: "Manager Reports" },
      { key: "manager_settings", label: "Manager Settings" },
    ],
  },
  {
    category: "Super Admin Portal",
    permissions: [
      { key: "super_admin_dashboard", label: "Super Admin Dashboard" },
      { key: "super_admin_users", label: "Super Admin Users" },
      { key: "super_admin_organizations", label: "Super Admin Organizations" },
      { key: "super_admin_subscriptions", label: "Super Admin Subscriptions" },
      { key: "super_admin_analytics", label: "Super Admin Analytics" },
      { key: "super_admin_database", label: "Super Admin Database" },
      { key: "super_admin_settings", label: "Super Admin Settings" },
    ],
  },
  {
    category: "Staff Portal",
    permissions: [
      { key: "staff_dashboard", label: "Staff Dashboard" },
      { key: "staff_maintenance", label: "Staff Maintenance" },
      { key: "staff_properties", label: "Staff Properties" },
    ],
  },
];

interface PermissionManagerProps {
  users: { id: string; email: string; full_name: string | null }[];
}

export const PermissionManager = ({ users }: PermissionManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user's roles
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles-for-permissions", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", selectedUserId);
      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!selectedUserId,
  });

  // Fetch manually assigned permissions
  const { data: manualPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["user-permissions", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", selectedUserId);
      if (error) throw error;
      return data.map((p) => p.permission);
    },
    enabled: !!selectedUserId,
  });

  const isLoading = rolesLoading || permissionsLoading;

  // Compute role-based default permissions
  const roleDefaultPermissions = useMemo(() => {
    const perms = new Set<string>();
    userRoles.forEach((role) => {
      (ROLE_PERMISSIONS[role] || []).forEach((p) => perms.add(p));
    });
    return perms;
  }, [userRoles]);

  // Merge role defaults + manual overrides when data loads
  useEffect(() => {
    const merged = new Set<string>([...roleDefaultPermissions, ...manualPermissions]);
    setCheckedPermissions(merged);
    setHasChanges(false);
  }, [roleDefaultPermissions, manualPermissions]);

  // Effective permission count
  const totalPermissions = checkedPermissions.size;

  const savePermissions = useMutation({
    mutationFn: async () => {
      // Calculate which permissions are manual overrides (beyond role defaults)
      const toSave = Array.from(checkedPermissions).filter(
        (p) => !roleDefaultPermissions.has(p)
      );
      // Also track role defaults that were unchecked (removed) — store nothing for those,
      // the runtime hook will merge role defaults + manual, so we only store extras.
      
      // Delete all existing manual permissions for user
      await supabase.from("user_permissions").delete().eq("user_id", selectedUserId);
      
      // Insert only the non-role-default permissions (manual overrides)
      if (toSave.length > 0) {
        const rows = toSave.map((permission) => ({
          user_id: selectedUserId,
          permission,
        }));
        const { error } = await supabase.from("user_permissions").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", selectedUserId] });
      toast.success("Permissions updated successfully");
      setHasChanges(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const togglePermission = (key: string) => {
    setCheckedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setHasChanges(true);
  };

  const toggleCategory = (category: typeof ALL_PERMISSIONS[number]) => {
    const allChecked = category.permissions.every((p) => checkedPermissions.has(p.key));
    setCheckedPermissions((prev) => {
      const next = new Set(prev);
      category.permissions.forEach((p) => {
        if (allChecked) next.delete(p.key);
        else next.add(p.key);
      });
      return next;
    });
    setHasChanges(true);
  };

  const isRoleDefault = (key: string) => roleDefaultPermissions.has(key);

  return (
    <div className="space-y-6">
      {/* User selector + summary + save */}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="space-y-2 flex-1 max-w-sm">
          <label className="text-sm font-medium">Select User</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user to manage permissions" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && !isLoading && (
          <div className="flex items-center gap-3">
            {/* Role badge */}
            {userRoles.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Role:</span>
                {userRoles.map((role) => (
                  <Badge key={role} variant="outline" className="capitalize text-xs">
                    {role.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            )}
            {/* Summary count */}
            <Badge variant="secondary" className="gap-1.5">
              <Shield className="w-3 h-3" />
              {totalPermissions} Permissions Assigned
            </Badge>
          </div>
        )}

        {selectedUserId && hasChanges && (
          <Button onClick={() => savePermissions.mutate()} disabled={savePermissions.isPending} className="gap-2">
            {savePermissions.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Permissions
          </Button>
        )}
      </div>

      {/* Role defaults info */}
      {selectedUserId && !isLoading && userRoles.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Permissions marked with a <Badge variant="outline" className="text-[10px] px-1.5 py-0 mx-0.5 align-middle">Role</Badge> badge come from the user's role defaults. 
            You can grant additional permissions or uncheck role defaults to override them for this user only.
          </span>
        </div>
      )}

      {/* Quick Templates */}
      {selectedUserId && !isLoading && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2"><Zap className="w-4 h-4" /> Quick Templates</h4>
          <div className="flex flex-wrap gap-2">
            {PERMISSION_TEMPLATES.map((tpl) => (
              <Button
                key={tpl.name}
                variant="outline"
                size="sm"
                className={`gap-2 ${tpl.color}`}
                onClick={() => {
                  setCheckedPermissions(new Set(tpl.permissions));
                  setHasChanges(true);
                  toast.info(`Applied "${tpl.name}" template`);
                }}
              >
                {tpl.icon}
                {tpl.name}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Click a template to apply, then Save to confirm.</p>
        </div>
      )}

      {/* Permission grid */}
      {!selectedUserId ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a user above to manage their permissions</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading permissions...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_PERMISSIONS.map((category) => {
            const allChecked = category.permissions.every((p) => checkedPermissions.has(p.key));
            const someChecked = category.permissions.some((p) => checkedPermissions.has(p.key));
            return (
              <div key={category.category} className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allChecked}
                    // @ts-ignore
                    indeterminate={someChecked && !allChecked}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <h4 className="font-semibold text-sm">{category.category}</h4>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {category.permissions.filter((p) => checkedPermissions.has(p.key)).length}/{category.permissions.length}
                  </Badge>
                </div>
                <div className="space-y-2 pl-6">
                  {category.permissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Checkbox
                        checked={checkedPermissions.has(perm.key)}
                        onCheckedChange={() => togglePermission(perm.key)}
                      />
                      <span className="flex-1">{perm.label}</span>
                      {isRoleDefault(perm.key) && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 opacity-60">Role</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
