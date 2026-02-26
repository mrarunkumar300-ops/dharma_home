import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Bug, UserCheck, AlertTriangle, RefreshCw } from "lucide-react";

export const RoleDetectionDebug = () => {
  const { user, session } = useAuth();
  const { roles, isAdmin, isManager, isUser, isTenant, isLoading, hasAnyRole } = useUserRole();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDebugCheck = async () => {
    setIsChecking(true);
    
    try {
      if (!user?.id) {
        setDebugInfo({ error: "No user logged in" });
        return;
      }

      console.log("🔍 Starting comprehensive role detection debug for user:", user.id);

      // Check 1: User metadata
      const userMetadata = user.user_metadata || {};
      console.log("📝 User metadata:", userMetadata);

      // Check 2: Direct database query
      const { data: dbRoles, error: dbError } = await supabase
        .from("user_roles")
        .select("role, created_at")
        .eq("user_id", user.id);

      console.log("🗄️ Database roles query result:", { dbRoles, dbError });

      // Check 3: Profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("👤 Profile data:", { profile, profileError });

      // Check 4: Tenant profile (if applicable)
      const { data: tenantProfile, error: tenantError } = await (supabase as any)
        .from("tenants_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("🏠 Tenant profile:", { tenantProfile, tenantError });

      // Compile debug information
      const debugData = {
        userId: user.id,
        email: user.email,
        userMetadata: {
          role: userMetadata.role,
          signup_role: userMetadata.signup_role,
          user_role: userMetadata.user_role,
          role_validated: userMetadata.role_validated,
          signup_method: userMetadata.signup_method
        },
        databaseRoles: dbRoles || [],
        databaseError: dbError?.message,
        profile: profile,
        profileError: profileError?.message,
        tenantProfile: tenantProfile,
        tenantError: tenantError?.message,
        hookResults: {
          roles,
          isAdmin,
          isManager,
          isUser,
          isTenant,
          hasAnyRole,
          isLoading
        },
        timestamp: new Date().toISOString()
      };

      setDebugInfo(debugData);
      console.log("🔍 Complete debug data:", debugData);

    } catch (error: any) {
      console.error("❌ Debug check failed:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsChecking(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo(null);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Role Detection Debug
        </CardTitle>
        <CardDescription>
          Comprehensive debugging for role detection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Session Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Current Session
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Logged In:</span>
              <Badge variant={session ? "default" : "secondary"} className="ml-2">
                {session ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">User ID:</span>
              <span className="ml-2 font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div>
              <span className="font-medium">Has Role:</span>
              <Badge variant={hasAnyRole ? "default" : "destructive"} className="ml-2">
                {hasAnyRole ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Loading:</span>
              <Badge variant={isLoading ? "secondary" : "outline"} className="ml-2">
                {isLoading ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Role Status */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Role Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Admin:</span>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Manager:</span>
              <Badge variant={isManager ? "default" : "secondary"}>
                {isManager ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">User:</span>
              <Badge variant={isUser ? "default" : "secondary"}>
                {isUser ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Tenant:</span>
              <Badge variant={isTenant ? "default" : "secondary"}>
                {isTenant ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Detected Roles:</span>
            <div className="flex gap-2 mt-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  No roles detected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Debug Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={runDebugCheck} 
            disabled={isChecking || !user}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? "Running Debug..." : "Run Debug Check"}
          </Button>
          <Button variant="outline" onClick={clearDebug}>
            Clear Debug Info
          </Button>
        </div>

        {/* Debug Results */}
        {debugInfo && (
          <div className="space-y-4">
            <h3 className="font-semibold">Debug Results</h3>
            {debugInfo.error ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive font-medium">Error: {debugInfo.error}</p>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4">
                <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
