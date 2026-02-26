import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTenantProfile } from "@/hooks/useTenantProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Calendar, Home, Edit2, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const TenantPersonalDetails = () => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = useTenantProfile();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const tenantData = dashboardData?.profile;
  const roomData = dashboardData?.room;

  useEffect(() => {
    if (tenantData) {
      setFullName(tenantData.full_name || "");
      setPhone(tenantData.phone || "");
      setAddress(tenantData.address || "");
    }
  }, [tenantData]);

  const handleSave = async () => {
    if (!user?.id || !tenantData) return;
    const { error } = await supabase
      .from("tenants_profile")
      .update({ full_name: fullName, phone, address })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      setEditing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tenantData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <User className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Tenant profile not found. Please contact your administrator.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Personal Details</h1>
            <p className="text-muted-foreground mt-1">View and manage your personal information</p>
          </div>
          <Button
            variant={editing ? "default" : "outline"}
            onClick={() => {
              if (editing) handleSave();
              else setEditing(true);
            }}
            className="gap-2"
          >
            {editing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    {tenantData.profile_photo_url ? (
                      <img src={tenantData.profile_photo_url} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{tenantData.full_name}</h2>
                    <p className="text-sm text-muted-foreground">{tenantData.email}</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {tenantData.tenant_code}
                  </Badge>
                  <Badge variant={tenantData.status === "active" ? "default" : "secondary"}>
                    {tenantData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Personal Information</CardTitle>
                <CardDescription>Your registered information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    {editing ? (
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{tenantData.full_name || "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{tenantData.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    {editing ? (
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{tenantData.phone || "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    {editing ? (
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{tenantData.address || "—"}</span>
                      </div>
                    )}
                  </div>
                  {tenantData.date_of_birth && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(tenantData.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                  {tenantData.gender && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <span className="text-sm capitalize">{tenantData.gender}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {(tenantData.emergency_contact_name || tenantData.emergency_contact_phone) && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-medium mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{tenantData.emergency_contact_name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{tenantData.emergency_contact_phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Rental Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5" /> Rental Information</CardTitle>
              <CardDescription>Your current lease and unit details</CardDescription>
            </CardHeader>
            <CardContent>
              {roomData ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Property</p>
                    <p className="font-medium text-sm">{(roomData as any)?.properties?.name || "—"}</p>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Room / Unit</p>
                    <p className="font-medium text-sm">{roomData.room_number}</p>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Agreement Period</p>
                    <p className="font-medium text-sm">
                      {roomData.agreement_start_date
                        ? `${new Date(roomData.agreement_start_date).toLocaleDateString()} — ${roomData.agreement_end_date ? new Date(roomData.agreement_end_date).toLocaleDateString() : "Ongoing"}`
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                    <p className="font-medium text-sm">${roomData.rent_amount}/month</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Home className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No room assigned yet. Contact your administrator.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default TenantPersonalDetails;
