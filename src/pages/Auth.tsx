import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Mail, Lock, Shield, Crown, Users, User, Briefcase, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type LoginRole = "super_admin" | "admin" | "manager" | "tenant" | "staff" | "user";

const roleConfig: { value: LoginRole; label: string; icon: typeof Shield; description: string }[] = [
  { value: "super_admin", label: "Platform Super Admin", icon: Shield, description: "Platform control" },
  { value: "admin", label: "Organization Admin", icon: Crown, description: "Organization management" },
  { value: "manager", label: "Manager", icon: Users, description: "Property operations" },
  { value: "staff", label: "Staff", icon: Briefcase, description: "Staff operations" },
  { value: "tenant", label: "Tenant", icon: User, description: "Tenant portal" },
  { value: "user", label: "User", icon: Eye, description: "User access" },
];

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<LoginRole>("admin");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }

      // After successful auth, verify the user has the selected role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication failed");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roleError || !roles?.length) {
        toast.error("No role assigned to this account. Contact your administrator.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      const userRoles = roles.map((r) => r.role as string);
      if (!userRoles.includes(selectedRole)) {
        toast.error("Invalid role for this account.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      toast.success("Welcome back!");
      // Redirect based on role
      const roleRoutes: Record<LoginRole, string> = {
        super_admin: "/super-admin",
        admin: "/admin",
        manager: "/manager",
        staff: "/staff",
        tenant: "/tenant",
        user: "/user",
      };
      navigate(roleRoutes[selectedRole] || "/");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 glow-primary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PropFlow</h1>
          <p className="text-muted-foreground text-sm mt-1">Enterprise Property Management</p>
        </div>

        <div className="glass-card p-5 space-y-4">
          {/* Role selector */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Login as</Label>
            <div className="grid grid-cols-2 gap-2">
              {roleConfig.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
                  className={cn(
                    "flex min-h-12 min-w-0 items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] sm:text-sm font-medium transition-all border",
                    selectedRole === value
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 whitespace-normal break-words text-center leading-snug" title={label}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Account access is managed by your administrator.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
