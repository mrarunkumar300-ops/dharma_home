import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export const RoleBasedRedirect = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { isSuperAdmin, isAdmin, isManager, isUser, isTenant, isStaff, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!session) {
        navigate("/auth");
      } else if (isSuperAdmin) {
        navigate("/super-admin");
      } else if (isAdmin) {
        navigate("/admin");
      } else if (isManager) {
        navigate("/manager");
      } else if (isStaff) {
        navigate("/staff");
      } else if (isTenant) {
        navigate("/tenant");
      } else {
        navigate("/user");
      }
    }
  }, [navigate, session, loading, roleLoading, isSuperAdmin, isAdmin, isManager, isUser, isTenant, isStaff]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};
