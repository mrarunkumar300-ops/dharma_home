import { ROUTES } from "@/routes";

// Hook for easy route access
export const useRoutes = () => {
  return ROUTES;
};

// Helper functions for navigation
export const getRouteForRole = (role: string) => {
  switch (role) {
    case 'super_admin':
      return ROUTES.SUPER_ADMIN.DASHBOARD;
    case 'admin':
      return ROUTES.ADMIN.DASHBOARD;
    case 'manager':
      return ROUTES.MANAGER.DASHBOARD;
    case 'staff':
      return ROUTES.STAFF.DASHBOARD;
    case 'user':
      return ROUTES.USER.DASHBOARD;
    case 'tenant':
      return ROUTES.TENANT.DASHBOARD;
    default:
      return '/auth';
  }
};

export const getPaymentRoute = (role: string) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN.PAYMENT_VERIFICATION;
    case 'tenant':
      return ROUTES.TENANT.PAYMENTS_ENHANCED;
    default:
      return '/auth';
  }
};
