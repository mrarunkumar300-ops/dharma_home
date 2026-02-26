import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertTriangle, Shield } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  fallback?: string;
}

export const AdminRoute = ({ 
  children, 
  fallback = "/auth" 
}: AdminRouteProps) => {
  const { session, loading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  // Show loading spinner while checking auth and roles
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">
              This area is restricted to Administrator accounts only.
            </p>
            <p className="text-sm text-muted-foreground">
              You are trying to access the Admin dashboard with insufficient permissions.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = "/auth"}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
