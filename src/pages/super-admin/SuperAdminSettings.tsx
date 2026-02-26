import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Bell, Globe, Database, Lock, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const SuperAdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const { theme, setTheme } = useTheme();

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global platform settings and preferences.</p>
        </div>

        {/* General */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">General</h2>
              <p className="text-sm text-muted-foreground">Basic platform configuration</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Platform Name</p>
                <p className="text-xs text-muted-foreground">Displayed across the application</p>
              </div>
              <Input defaultValue="PropManager Pro" className="w-64" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Default Timezone</p>
                <p className="text-xs text-muted-foreground">Used for reports and logs</p>
              </div>
              <Input defaultValue="UTC" className="w-64" />
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Authentication and access controls</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Restrict access to super admins only</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={(v) => { setMaintenanceMode(v); toast.info(v ? "Maintenance mode enabled" : "Maintenance mode disabled"); }} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Public Registration</p>
                <p className="text-xs text-muted-foreground">Allow self-service sign-ups</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Disabled</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Badge variant="outline" className="bg-muted text-muted-foreground">Coming Soon</Badge>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Email and alert preferences</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive system alerts via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto Backup</p>
                <p className="text-xs text-muted-foreground">Automatic daily database backups</p>
              </div>
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">System Information</h2>
              <p className="text-sm text-muted-foreground">Platform version and status</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Version:</span> <span className="font-medium ml-2">1.0.0</span></div>
            <div><span className="text-muted-foreground">Environment:</span> <span className="font-medium ml-2">Production</span></div>
            <div><span className="text-muted-foreground">Database:</span> <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/20">Connected</Badge></div>
            <div><span className="text-muted-foreground">Auth:</span> <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/20">Active</Badge></div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Appearance</h4>
                <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
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
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;
