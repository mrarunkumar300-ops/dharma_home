import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  User, Building, Shield, Bell, Moon, Sun, LogOut, Save, Mail, Smartphone, Globe, Lock, IndianRupee
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CurrencySettings from "@/components/settings/CurrencySettings";

const Settings = () => {
  const { orgId, setupOrganization } = useOrganization();
  const { theme, setTheme } = useTheme();
  const { session, signOut, profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [orgName, setOrgName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated successfully");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleUpdateOrg = async () => {
    if (orgName) {
      try {
        await setupOrganization(orgName);
        toast.success("Organization updated");
      } catch (e) {
        toast.error("Failed to update organization");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account, organization, and system preferences.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Lock className="w-4 h-4" /> Security</TabsTrigger>
            <TabsTrigger value="organization" className="gap-2"><Building className="w-4 h-4" /> Organization</TabsTrigger>
            <TabsTrigger value="currency" className="gap-2"><IndianRupee className="w-4 h-4" /> Currency</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{profile?.full_name || session?.user?.email?.split("@")[0]}</h3>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input value={session?.user?.email || ""} disabled />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
                <Button className="glow-primary" onClick={handleUpdateProfile}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
              </div>
              <Button onClick={handleChangePassword} variant="outline" className="gap-2">
                <Shield className="w-4 h-4" /> Change Password
              </Button>
            </motion.div>
          </TabsContent>

          {/* Organization Settings */}
          <TabsContent value="organization">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                  <Input placeholder="PropFlow Inc." value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Business Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="https://propflow.ai" className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button className="glow-primary" onClick={handleUpdateOrg}>Update Organization</Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Currency Settings */}
          <TabsContent value="currency">
            <div className="glass-card p-6">
              <CurrencySettings />
            </div>
          </TabsContent>

          {/* Notification Preferences */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
              {[
                { title: "Email Notifications", desc: "Receive weekly revenue reports and maintenance alerts.", icon: Mail, checked: emailNotifications, onChange: setEmailNotifications },
                { title: "Push Notifications", desc: "Real-time alerts for urgent maintenance tickets.", icon: Smartphone, checked: pushNotifications, onChange: setPushNotifications },
                { title: "System Alerts", desc: "Important updates regarding your account and billing.", icon: Bell, checked: systemAlerts, onChange: setSystemAlerts },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onChange} />
                </div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Appearance */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Appearance</h4>
                <p className="text-xs text-muted-foreground">Customize how PropFlow looks on your device.</p>
              </div>
            </div>
            <div className="flex bg-muted rounded-lg p-1">
              <Button variant="ghost" size="sm" className={`h-8 px-3 gap-2 ${theme === "dark" ? "bg-background shadow-sm" : "opacity-50"}`} onClick={() => setTheme("dark")}>
                <Moon className="w-3 h-3" /> Dark
              </Button>
              <Button variant="ghost" size="sm" className={`h-8 px-3 gap-2 ${theme === "light" ? "bg-background shadow-sm" : "opacity-50"}`} onClick={() => setTheme("light")}>
                <Sun className="w-3 h-3" /> Light
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
