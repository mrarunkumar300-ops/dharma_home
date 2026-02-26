import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Users, Plus, User, Phone, Trash2, Heart, Loader2 } from "lucide-react";
import { useTenantProfile } from "@/hooks/useTenantProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TenantFamily = () => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: profileLoading } = useTenantProfile();
  const queryClient = useQueryClient();

  const tenantProfileId = dashboardData?.profile?.id;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["tenant-family-members", tenantProfileId],
    queryFn: async () => {
      if (!tenantProfileId) return [];
      const { data, error } = await supabase
        .from("tenant_family_members")
        .select("*")
        .eq("tenant_id", tenantProfileId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantProfileId,
  });

  const addMember = useMutation({
    mutationFn: async (member: { full_name: string; relationship: string; age?: number; phone?: string; gender?: string }) => {
      if (!tenantProfileId) throw new Error("Profile not found");
      const { data, error } = await supabase
        .from("tenant_family_members")
        .insert({ tenant_id: tenantProfileId, ...member })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-family-members"] });
      toast.success("Family member added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_family_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-family-members"] });
      toast.success("Family member removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelationship, setNewRelationship] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGender, setNewGender] = useState("");

  const handleAdd = () => {
    if (!newName || !newRelationship) {
      toast.error("Name and relationship are required");
      return;
    }
    addMember.mutate({
      full_name: newName,
      relationship: newRelationship,
      age: parseInt(newAge) || undefined,
      phone: newPhone || undefined,
      gender: newGender || undefined,
    });
    setDialogOpen(false);
    setNewName(""); setNewRelationship(""); setNewAge(""); setNewPhone(""); setNewGender("");
  };

  const relationshipColors: Record<string, string> = {
    Spouse: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    Child: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Parent: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Sibling: "bg-green-500/10 text-green-600 border-green-500/20",
    Other: "bg-muted text-muted-foreground",
  };

  if (profileLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Family Members</h1>
            <p className="text-muted-foreground mt-1">Manage your registered family members</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Members", value: members.length, icon: Users },
            { label: "Adults", value: members.filter(m => (m.age || 0) >= 18).length, icon: User },
            { label: "Children", value: members.filter(m => (m.age || 0) < 18 && m.age).length, icon: Heart },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Members Grid */}
        {members.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No family members registered yet</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" /> Add Your First Member
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, i) => (
              <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{member.full_name}</p>
                          <Badge variant="outline" className={`text-xs mt-1 ${relationshipColors[member.relationship] || ""}`}>
                            {member.relationship}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeMember.mutate(member.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {member.age && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> Age: {member.age} years
                        </div>
                      )}
                      {member.gender && (
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{member.gender}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5" /> {member.phone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Family Member</DialogTitle>
              <DialogDescription>Register a new family member</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship *</label>
                <Select value={newRelationship} onValueChange={setNewRelationship}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <Input type="number" value={newAge} onChange={(e) => setNewAge(e.target.value)} placeholder="Age" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <Select value={newGender} onValueChange={setNewGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={addMember.isPending}>
                {addMember.isPending ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TenantFamily;
