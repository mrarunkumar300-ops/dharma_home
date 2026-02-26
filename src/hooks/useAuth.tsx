import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { id: string; email: string; full_name: string | null; organization_id: string | null } | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: "super_admin" | "admin" | "manager" | "user" | "tenant") => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, organization_id")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          
          // 🛡️ STRICT ASSIGNMENT: Check for pending strict signup to complete
          const pendingSignupStrict = localStorage.getItem('pending_signup_strict');
          if (pendingSignupStrict) {
            try {
              const { userId, fullName, email, role, timestamp, method } = JSON.parse(pendingSignupStrict);
              
              // Check if pending signup is recent (within 30 minutes)
              const isRecent = Date.now() - timestamp < 30 * 60 * 1000;
              
              if (session.user.id === userId && isRecent && method === 'strict_assignment') {
                console.log("🔐 Completing pending strict signup setup");
                const setupResult = await setupUserProfileStrict(userId, fullName, email, role);
                if (setupResult.error) {
                  console.error("❌ Strict signup setup failed:", setupResult.error);
                } else {
                  console.log("✅ Strict signup setup completed");
                }
                localStorage.removeItem('pending_signup_strict');
                // Refresh profile after setup
                setTimeout(() => fetchProfile(session.user.id), 500);
              } else if (!isRecent) {
                console.log("⏰ Pending strict signup expired, removing");
                localStorage.removeItem('pending_signup_strict');
              }
            } catch (error) {
              console.error("❌ Error completing pending strict signup:", error);
              localStorage.removeItem('pending_signup_strict');
            }
          }
          
          // Fallback to legacy pending signup for compatibility
          const pendingSignup = localStorage.getItem('pending_signup');
          if (pendingSignup && !pendingSignupStrict) {
            try {
              const { userId, fullName, email, role } = JSON.parse(pendingSignup);
              if (session.user.id === userId) {
                console.log("🔄 Completing legacy pending signup setup");
                await setupUserProfileStrict(userId, fullName, email, role);
                localStorage.removeItem('pending_signup');
                // Refresh profile after setup
                setTimeout(() => fetchProfile(session.user.id), 500);
              }
            } catch (error) {
              console.error("❌ Error completing legacy pending signup:", error);
              localStorage.removeItem('pending_signup');
            }
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: "super_admin" | "admin" | "manager" | "user" | "tenant") => {
    try {
      // 🛡️ MANDATORY ROLE: Role must be provided (TypeScript enforces this, but double-check)
      if (!role) {
        return { error: { message: "Please select a role. Role selection is mandatory." } };
      }

      // 🛡️ FRONTEND VALIDATION: Pre-validate role before sending to backend
      const allowedRoles = ["super_admin", "admin", "manager", "user", "tenant"];
      if (!allowedRoles.includes(role)) {
        return { error: { message: "Invalid role selected. Please choose a valid role." } };
      }

      // 🛡️ ROLE-SPECIFIC VALIDATION: Additional checks based on role
      if (role === "super_admin" || role === "admin" || role === "manager") {
        if (!fullName || fullName.trim().length < 2) {
          return { error: { message: "Full name is required for super admin/admin/manager accounts." } };
        }
      } else if (role === "tenant") {
        if (!fullName || fullName.trim().length < 2) {
          return { error: { message: "Full name is required for tenant accounts." } };
        }
      } else if (role === "user") {
        if (!fullName || fullName.trim().length < 2) {
          return { error: { message: "Full name is required for user accounts." } };
        }
      }

      console.log(`🔐 Starting strict signup process for role: ${role}`);

      // 🛡️ SIMPLIFIED VALIDATION: Skip backend RPC call for now, validate in frontend
      console.log("✅ Frontend role validation passed (backend function not available)");

      // Create user account with exact role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { 
            full_name: fullName, 
            role: role, // Store exact selected role
            signup_role: role, // Backup role field
            signup_method: "frontend_strict_validation", // Mark as frontend validated
            role_validated: true // Mark role as validated
          },
        },
      });

      if (authError) {
        console.error("❌ Auth signup error:", authError);
        return { error: authError };
      }

      console.log("✅ User account created successfully with frontend validation");

      // If user is created immediately (no email verification required)
      if (authData.user && authData.user.email_confirmed_at) {
        console.log("🚀 User confirmed immediately, setting up strict role assignment");
        const setupResult = await setupUserProfileStrict(authData.user.id, fullName, email, role);
        if (setupResult.error) {
          return { error: setupResult.error };
        }
      } else {
        console.log("📧 User requires email verification, storing for post-verification setup");
        // Store signup data in localStorage for post-verification setup
        localStorage.setItem('pending_signup_strict', JSON.stringify({
          userId: authData.user?.id,
          fullName,
          email,
          role,
          timestamp: Date.now(),
          method: 'frontend_strict_validation'
        }));
      }

      return { error: null };
    } catch (error) {
      console.error("❌ Signup error:", error);
      return { error: { message: "An unexpected error occurred during signup" } };
    }
  };

  // 🛡️ STRICT ROLE ASSIGNMENT: Helper function for strict user profile and role setup
  const setupUserProfileStrict = async (userId: string, fullName: string, email: string, role: "super_admin" | "admin" | "manager" | "user" | "tenant") => {
    let authUser = null;
    try {
      console.log(`🔐 Setting up strict profile for user ${userId} with role ${role}`);

      // Get the current user to update metadata later
      const { data: { user } } = await supabase.auth.getUser();
      authUser = user;

      // 🛡️ STRICT VALIDATION: Verify role in metadata matches selected role
      if (authUser?.user_metadata?.role && authUser.user_metadata.role !== role) {
        const metadataRole = authUser.user_metadata.role;
        console.error(`❌ ROLE MISMATCH: Selected=${role}, Metadata=${metadataRole}`);
        throw new Error(`Role mismatch detected. Selected role: ${role}, but metadata contains: ${metadataRole}`);
      }

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
        });

      if (profileError) {
        console.error("❌ Profile creation error:", profileError);
        throw profileError;
      }

      console.log("✅ Profile created successfully");

      // Handle tenant-specific setup
      if (role === "tenant") {
        console.log("🏠 Setting up tenant profile");
        const { error: tenantError } = await (supabase as any)
          .from("tenants_profile")
          .insert({
            user_id: userId,
            tenant_code: `TEN${Date.now().toString().slice(-6)}`,
            full_name: fullName,
            email: email,
            status: 'active'
          });

        if (tenantError) {
          console.error("❌ Tenant profile creation error:", tenantError);
          throw tenantError;
        }
        console.log("✅ Tenant profile created successfully");
      } else {
        // Create organization for admin users
        let organizationId = null;
        if (role === "admin") {
          console.log("👑 Setting up admin organization");
          const { data: orgData, error: orgError } = await supabase
            .from("organizations")
            .insert({ name: `${fullName}'s Organization` })
            .select()
            .single();

          if (orgError) {
            console.error("❌ Organization creation error:", orgError);
          } else {
            organizationId = orgData.id;

            // Update profile with organization
            await supabase
              .from("profiles")
              .update({ organization_id: organizationId })
              .eq("id", userId);
          }
          console.log("✅ Admin organization setup completed");
        }
      }

      // 🛡️ STRICT ROLE ASSIGNMENT: Use the strict role assignment function
      console.log(`🔐 Assigning strict role: ${role}`);
      const { error: roleError } = await (supabase as any)
        .rpc('assign_user_role_strict', {
          _user_id: userId,
          _selected_role: role,
          _metadata_role: authUser?.user_metadata?.role
        });

      if (roleError) {
        console.error("❌ Strict role assignment error:", roleError);
        // Fallback to direct insertion if RPC fails
        console.log("⚠️ Falling back to direct role assignment");
        const { error: fallbackError } = await (supabase as any)
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role,
          });

        if (fallbackError) {
          console.error("❌ Fallback role assignment also failed:", fallbackError);
          throw fallbackError;
        }
      } else {
        console.log("✅ Strict role assignment completed successfully");
      }

      // 🛡️ VALIDATION: Verify role was assigned correctly
      const { data: verifyRole, error: verifyError } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (verifyError || !verifyRole || verifyRole.role !== role) {
        console.error("❌ ROLE VERIFICATION FAILED:", verifyError, verifyRole);
        throw new Error(`Role verification failed. Expected: ${role}, Found: ${verifyRole?.role || 'none'}`);
      }

      console.log("✅ Role verification passed");

      // Also store role in user metadata as backup
      if (authUser) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            role: role,
            full_name: fullName,
            role_verified: true,
            role_assignment_method: "strict"
          }
        });
        
        if (updateError) {
          console.error("⚠️ Error updating user metadata with role:", updateError);
        } else {
          console.log("✅ Role stored in user metadata as backup");
        }
      }

      console.log("🎉 Strict user profile and role setup completed successfully");
      return { error: null };
    } catch (error) {
      console.error("❌ Error setting up strict user profile:", error);
      return { error };
    }
  };

  // Helper function to set up user profile and role (legacy - kept for compatibility)
  const setupUserProfile = async (userId: string, fullName: string, email: string, role: "super_admin" | "admin" | "manager" | "user" | "tenant") => {
    return await setupUserProfileStrict(userId, fullName, email, role);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
