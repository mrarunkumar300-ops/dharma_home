import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { CurrencyProvider } from "@/hooks/useCurrency";
import AppRoutes from "@/routes";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    
    
    {/* Role-based root redirect */}
    <Route path="/" element={<RoleBasedRedirect />} />
    
    {/* Super Admin routes */}
    <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
    <Route path="/super-admin/users" element={<SuperAdminRoute><SuperAdminUsers /></SuperAdminRoute>} />
    <Route path="/super-admin/logs" element={<SuperAdminRoute><SuperAdminActivityLogs /></SuperAdminRoute>} />
    <Route path="/super-admin/roles" element={<SuperAdminRoute><SuperAdminRoles /></SuperAdminRoute>} />
    <Route path="/super-admin/organizations" element={<SuperAdminRoute><SuperAdminOrganizations /></SuperAdminRoute>} />
    
    <Route path="/super-admin/subscriptions" element={<SuperAdminRoute><SuperAdminSubscriptions /></SuperAdminRoute>} />
    <Route path="/super-admin/analytics" element={<SuperAdminRoute><SuperAdminAnalytics /></SuperAdminRoute>} />
    <Route path="/super-admin/database" element={<SuperAdminRoute><SuperAdminDatabase /></SuperAdminRoute>} />
    <Route path="/super-admin/settings" element={<SuperAdminRoute><SuperAdminSettings /></SuperAdminRoute>} />
    
    {/* Admin-only routes */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/properties" element={<AdminRoute><Properties /></AdminRoute>} />
    <Route path="/admin/tenants" element={<AdminRoute><Tenants /></AdminRoute>} />
    <Route path="/admin/units" element={<AdminRoute><Units /></AdminRoute>} />
    <Route path="/admin/billing" element={<AdminRoute><Billing /></AdminRoute>} />
    <Route path="/admin/payments" element={<AdminRoute><Payments /></AdminRoute>} />
    <Route path="/admin/payment-verification" element={<AdminRoute><PaymentVerification /></AdminRoute>} />
    <Route path="/admin/maintenance" element={<AdminRoute><Maintenance /></AdminRoute>} />
    <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
    <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
    <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
    <Route path="/admin/backend" element={<AdminRoute><BackendDashboard /></AdminRoute>} />
    <Route path="/admin/tenant-data" element={<AdminRoute><TenantDataListing /></AdminRoute>} />
    <Route path="/admin/inventory" element={<AdminRoute><InventoryManagement /></AdminRoute>} />
    <Route path="/admin/tenants/:tenantId" element={<AdminRoute><TenantDetail /></AdminRoute>} />
    
    
    {/* Manager routes */}
    <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
    <Route path="/manager/properties" element={<ManagerRoute><Properties /></ManagerRoute>} />
    <Route path="/manager/tenants" element={<ManagerRoute><Tenants /></ManagerRoute>} />
    <Route path="/manager/units" element={<ManagerRoute><Units /></ManagerRoute>} />
    <Route path="/manager/billing" element={<ManagerRoute><Billing /></ManagerRoute>} />
    <Route path="/manager/payments" element={<ManagerRoute><Payments /></ManagerRoute>} />
    <Route path="/manager/maintenance" element={<ManagerRoute><Maintenance /></ManagerRoute>} />
    <Route path="/manager/settings" element={<ManagerRoute><Settings /></ManagerRoute>} />

    {/* Staff routes */}
    <Route path="/staff" element={<StaffRoute><StaffDashboard /></StaffRoute>} />
    <Route path="/staff/properties" element={<StaffRoute><Properties /></StaffRoute>} />
    <Route path="/staff/maintenance" element={<StaffRoute><Maintenance /></StaffRoute>} />
    <Route path="/staff/units" element={<StaffRoute><Units /></StaffRoute>} />
    <Route path="/staff/settings" element={<StaffRoute><Settings /></StaffRoute>} />

    {/* User-only routes */}
    <Route path="/user" element={<UserRoute><UserDashboard /></UserRoute>} />
    <Route path="/user/journey" element={<UserRoute><UserJourney /></UserRoute>} />
    <Route path="/user/properties" element={<UserRoute><Properties /></UserRoute>} />
    <Route path="/user/tenants" element={<UserRoute><Tenants /></UserRoute>} />
    <Route path="/user/units" element={<UserRoute><Units /></UserRoute>} />
    <Route path="/user/billing" element={<UserRoute><Billing /></UserRoute>} />
    <Route path="/user/payments" element={<UserRoute><Payments /></UserRoute>} />
    <Route path="/user/maintenance" element={<UserRoute><Maintenance /></UserRoute>} />
    <Route path="/user/settings" element={<UserRoute><Settings /></UserRoute>} />
    
    {/* Tenant-only routes */}
    <Route path="/tenant" element={<TenantRoute><TenantDashboard /></TenantRoute>} />
    <Route path="/tenant/profile" element={<TenantRoute><TenantPersonalDetails /></TenantRoute>} />
    <Route path="/tenant/documents" element={<TenantRoute><TenantDocuments /></TenantRoute>} />
    <Route path="/tenant/family" element={<TenantRoute><TenantFamily /></TenantRoute>} />
    <Route path="/tenant/bills" element={<TenantRoute><TenantBills /></TenantRoute>} />
    <Route path="/tenant/payments" element={<TenantRoute><TenantPayments /></TenantRoute>} />
    <Route path="/tenant/payments-enhanced" element={<TenantRoute><TenantPaymentsEnhanced /></TenantRoute>} />
    <Route path="/tenant/complaints" element={<TenantRoute><TenantComplaints /></TenantRoute>} />
    <Route path="/tenant/notifications" element={<TenantRoute><TenantNotifications /></TenantRoute>} />
    <Route path="/tenant/settings" element={<TenantRoute><TenantSettings /></TenantRoute>} />
    
    {/* Legacy routes - redirect to role-specific routes */}
    <Route path="/properties" element={<Navigate to="/admin/properties" replace />} />
    <Route path="/tenants" element={<Navigate to="/admin/tenants" replace />} />
    <Route path="/units" element={<Navigate to="/admin/units" replace />} />
    <Route path="/billing" element={<Navigate to="/admin/billing" replace />} />
    <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
    <Route path="/maintenance" element={<Navigate to="/admin/maintenance" replace />} />
    <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
    <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
    <Route path="/users" element={<Navigate to="/admin/users" replace />} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
