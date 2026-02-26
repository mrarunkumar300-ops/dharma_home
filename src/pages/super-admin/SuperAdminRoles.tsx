import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, Plus, Trash2, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PermissionManager } from "@/components/super-admin/PermissionManager";

const SuperAdminRoles = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { data: roleAssignments = [], isLoading } = useQuery({
    queryKey: ["super-admin-role-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role");
      if (error) throw error;

      const userIds = [...new Set(data?.map((r) => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, organization_id")
        .in("id", userIds);

      const orgIds = [...new Set((profiles || []).map((p) => p.organization_id).filter(Boolean) as string[])];
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const orgMap = new Map(orgs?.map((o) => [o.id, o.name]) || []);

      return (data || []).map((r) => ({
        ...r,
        email: profileMap.get(r.user_id)?.email || "Unknown",
        full_name: profileMap.get(r.user_id)?.full_name || null,
        organization_name: profileMap.get(r.user_id)?.organization_id
          ? orgMap.get(profileMap.get(r.user_id)?.organization_id) || "—"
          : "—",
      }));
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["super-admin-all-profiles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, organization_id");
      if (error) throw error;

      const orgIds = [...new Set((profiles || []).map((p) => p.organization_id).filter(Boolean) as string[])];
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);
      const orgMap = new Map(orgs?.map((o) => [o.id, o.name]) || []);

      return (profiles || []).map((p) => ({
        ...p,
        organization_name: p.organization_id ? orgMap.get(p.organization_id) || "—" : "—",
      }));
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-role-assignments"] });
      toast.success("Role assigned successfully");
      setAssignDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-role-assignments"] });
      toast.success("Role removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = roleAssignments.filter(
    (r) =>
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.role?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    super_admin: "bg-destructive/10 text-destructive border-destructive/20",
    admin: "bg-primary/10 text-primary border-primary/20",
    manager: "bg-warning/10 text-warning border-warning/20",
    user: "bg-muted text-muted-foreground",
    tenant: "bg-accent/50 text-accent-foreground border-accent/30",
    staff: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Platform Super Admin",
    admin: "Organization Admin",
    manager: "Manager",
    user: "User",
    tenant: "Tenant",
    staff: "Staff",
  };

  const roleCounts = roleAssignments.reduce((acc, r) => {
    acc[r.role] = (acc[r.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
            <p className="text-muted-foreground mt-1">Manage role assignments and granular permissions across the platform.</p>
          </div>
          <Button onClick={() => setAssignDialogOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Assign Role
          </Button>
        </div>

        {/* Role Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {["super_admin", "admin", "manager", "user", "tenant", "staff"].map((role) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{(roleLabels[role] || role).concat("s")}</p>
                  <p className="text-2xl font-bold mt-1">{roleCounts[role] || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs: Role Assignments & Permissions */}
        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles" className="gap-2"><Shield className="w-4 h-4" /> Role Assignments</TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2"><KeyRound className="w-4 h-4" /> Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by user or role..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No role assignments found</TableCell></TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{r.full_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{r.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[r.role] || ""}>
                            {roleLabels[r.role] || r.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{r.organization_name}</span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeRole.mutate(r.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionManager users={allUsers} />
          </TabsContent>
        </Tabs>

        {/* Assign Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
              <DialogDescription>Select a user and assign a role.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}{u.organization_name && u.organization_name !== "—" ? ` — ${u.organization_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Platform Super Admin</SelectItem>
                    <SelectItem value="admin">Organization Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { if (selectedUserId && selectedRole) assignRole.mutate({ userId: selectedUserId, role: selectedRole }); }} disabled={assignRole.isPending}>
                {assignRole.isPending ? "Assigning..." : "Assign Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRoles;
