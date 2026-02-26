import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Search, Plus, MoreHorizontal, Edit, Trash2, Users, Home, Shield, Calendar, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

interface OrgFormData {
  name: string;
  plan_price: string;
  plan_valid_until: string;
  admin_email: string;
  admin_password: string;
  admin_full_name: string;
}

const emptyForm: OrgFormData = {
  name: "",
  plan_price: "80000",
  plan_valid_until: "",
  admin_email: "",
  admin_password: "",
  admin_full_name: "",
};

const SuperAdminOrganizations = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const [formData, setFormData] = useState<OrgFormData>(emptyForm);
  const [membersOpen, setMembersOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get("create");
    if (create === "1") {
      setCreateOpen(true);
      setFormData(emptyForm);
      params.delete("create");
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["super-admin-organizations"],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: profiles } = await supabase.from("profiles").select("organization_id");
      const { data: properties } = await supabase.from("properties").select("organization_id");

      const memberCounts = new Map<string, number>();
      profiles?.forEach((p) => {
        if (p.organization_id) memberCounts.set(p.organization_id, (memberCounts.get(p.organization_id) || 0) + 1);
      });

      const propertyCounts = new Map<string, number>();
      properties?.forEach((p) => {
        propertyCounts.set(p.organization_id, (propertyCounts.get(p.organization_id) || 0) + 1);
      });

      return (orgs || []).map((o: any) => ({
        ...o,
        member_count: memberCounts.get(o.id) || 0,
        property_count: propertyCounts.get(o.id) || 0,
      }));
    },
  });

  const { data: orgMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["super-admin-org-members", selectedOrg?.id],
    queryFn: async () => {
      if (!selectedOrg?.id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("organization_id", selectedOrg.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: membersOpen && !!selectedOrg?.id,
  });

  const { data: orgProperties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ["super-admin-org-properties", selectedOrg?.id],
    queryFn: async () => {
      if (!selectedOrg?.id) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, address")
        .eq("organization_id", selectedOrg.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: propertiesOpen && !!selectedOrg?.id,
  });

  const createOrg = useMutation({
    mutationFn: async (data: OrgFormData) => {
      const res = await supabase.functions.invoke("create-organization", {
        body: {
          org_name: data.name,
          plan_price: parseFloat(data.plan_price) || 0,
          plan_valid_until: data.plan_valid_until || null,
          admin_email: data.admin_email || null,
          admin_password: data.admin_password || null,
          admin_full_name: data.admin_full_name || null,
        },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast.success(data.message || "Organization created");
      setCreateOpen(false);
      setFormData(emptyForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateOrg = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("organizations").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      toast.success("Organization updated");
      setEditingOrg(null);
      setOrgName("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteOrg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-organizations"] });
      toast.success("Organization deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = organizations.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "suspended": return "bg-destructive/10 text-destructive border-destructive/20";
      case "expired": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground mt-1">Manage all organizations and their subscription plans.</p>
          </div>
          <Button onClick={() => { setCreateOpen(true); setFormData(emptyForm); }} className="gap-2">
            <Plus className="w-4 h-4" /> Create Organization
          </Button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search organizations..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No organizations found</TableCell></TableRow>
              ) : (
                filtered.map((org: any) => (
                  <TableRow key={org.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(org.status || 'active')}`}>
                        {org.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                        {Number(org.plan_price || 0).toLocaleString("en-IN")}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {org.plan_valid_until ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(org.plan_valid_until).toLocaleDateString()}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedOrg(org);
                          setMembersOpen(true);
                        }}
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5" /> {org.member_count}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedOrg(org);
                          setPropertiesOpen(true);
                        }}
                      >
                        <Home className="w-3.5 h-3.5 mr-1.5" /> {org.property_count}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingOrg(org); setOrgName(org.name); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteOrg.mutate(org.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Create Organization + Admin Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>Set up a new organization with subscription plan and optional admin user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* Org Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Organization Details</h4>
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Royal Stay PG" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Plan Price (₹)</Label>
                    <Input type="number" value={formData.plan_price} onChange={(e) => setFormData({ ...formData, plan_price: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" value={formData.plan_valid_until} onChange={(e) => setFormData({ ...formData, plan_valid_until: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Admin User */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Organization Admin (Optional)</h4>
                <p className="text-xs text-muted-foreground">This user will manage everything inside this organization.</p>
                <div className="space-y-2">
                  <Label>Admin Full Name</Label>
                  <Input value={formData.admin_full_name} onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input type="email" value={formData.admin_email} onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} placeholder="admin@organization.com" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Password</Label>
                  <Input type="password" value={formData.admin_password} onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })} placeholder="Min 6 characters" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => formData.name && createOrg.mutate(formData)} disabled={createOrg.isPending || !formData.name}>
                {createOrg.isPending ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>Update organization details.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Organization Name</Label>
              <Input className="mt-2" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingOrg(null)}>Cancel</Button>
              <Button onClick={() => editingOrg && orgName && updateOrg.mutate({ id: editingOrg.id, name: orgName })} disabled={updateOrg.isPending}>
                {updateOrg.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={membersOpen}
          onOpenChange={(open) => {
            setMembersOpen(open);
            if (!open) setSelectedOrg(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Members</DialogTitle>
              <DialogDescription>
                {selectedOrg?.name ? `${selectedOrg.name} — ${selectedOrg.member_count || 0} total` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : orgMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No members found</TableCell>
                    </TableRow>
                  ) : (
                    orgMembers.map((m: any) => (
                      <TableRow key={m.id} className="border-border/30">
                        <TableCell className="text-sm">{m.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMembersOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={propertiesOpen}
          onOpenChange={(open) => {
            setPropertiesOpen(open);
            if (!open) setSelectedOrg(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Properties</DialogTitle>
              <DialogDescription>
                {selectedOrg?.name ? `${selectedOrg.name} — ${selectedOrg.property_count || 0} total` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Property</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertiesLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : orgProperties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No properties found</TableCell>
                    </TableRow>
                  ) : (
                    orgProperties.map((p: any) => (
                      <TableRow key={p.id} className="border-border/30">
                        <TableCell className="text-sm">{p.name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.address || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPropertiesOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminOrganizations;
