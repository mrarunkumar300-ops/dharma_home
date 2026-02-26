import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { UserRoute } from "@/components/auth/UserRoute";
import { TenantRoute } from "@/components/auth/TenantRoute";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";
import { ManagerRoute } from "@/components/auth/ManagerRoute";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { StaffRoute } from "@/components/auth/StaffRoute";

// Page Imports
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

// Super Admin Pages
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import SuperAdminUsers from "@/pages/super-admin/SuperAdminUsers";
import SuperAdminActivityLogs from "@/pages/super-admin/SuperAdminActivityLogs";
import SuperAdminRoles from "@/pages/super-admin/SuperAdminRoles";
import SuperAdminOrganizations from "@/pages/super-admin/SuperAdminOrganizations";
import SuperAdminSubscriptions from "@/pages/super-admin/SuperAdminSubscriptions";
import SuperAdminAnalytics from "@/pages/super-admin/SuperAdminAnalytics";
import SuperAdminDatabase from "@/pages/super-admin/SuperAdminDatabase";
import SuperAdminSettings from "@/pages/super-admin/SuperAdminSettings";
import TenantManagement from "@/pages/super-admin/TenantManagement";

// Admin Pages
import AdminDashboard from "@/pages/AdminDashboard";
import Properties from "@/pages/Properties";
import Tenants from "@/pages/Tenants";
import Units from "@/pages/Units";
import Billing from "@/pages/Billing";
import Payments from "@/pages/Payments";
import Maintenance from "@/pages/Maintenance";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { UserManagement } from "@/pages/UserManagement";
import { BackendDashboard } from "@/pages/BackendDashboard";
import { TenantDataListing } from "@/pages/TenantDataListing";
import { InventoryManagement } from "@/pages/InventoryManagement";
import TenantDetail from "@/pages/TenantDetail";
import PaymentVerification from "@/pages/admin/PaymentVerification";
import TenantManagementUnified from "@/pages/admin/TenantManagementUnified";

// Manager Pages
import ManagerDashboard from "@/pages/ManagerDashboard";

// Staff Pages
import StaffDashboard from "@/pages/StaffDashboard";

// User Pages
import UserDashboard from "@/pages/UserDashboard";
import UserJourney from "@/pages/UserJourney";

// Tenant Pages
import TenantDashboard from "@/pages/TenantDashboard";
import TenantPersonalDetails from "@/pages/tenant/TenantPersonalDetails";
import TenantDocuments from "@/pages/tenant/TenantDocuments";
import TenantFamily from "@/pages/tenant/TenantFamily";
import TenantBills from "@/pages/tenant/TenantBills";
import TenantPaymentsEnhanced from "@/pages/tenant/TenantPaymentsEnhanced";
import TenantComplaints from "@/pages/tenant/TenantComplaints";
import TenantNotifications from "@/pages/tenant/TenantNotifications";
import TenantSettings from "@/pages/tenant/TenantSettings";

export const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<RoleBasedRedirect />} />

    {/* Super Admin Routes */}
    <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
    <Route path="/super-admin/users" element={<SuperAdminRoute><SuperAdminUsers /></SuperAdminRoute>} />
    <Route path="/super-admin/logs" element={<SuperAdminRoute><SuperAdminActivityLogs /></SuperAdminRoute>} />
    <Route path="/super-admin/roles" element={<SuperAdminRoute><SuperAdminRoles /></SuperAdminRoute>} />
    <Route path="/super-admin/organizations" element={<SuperAdminRoute><SuperAdminOrganizations /></SuperAdminRoute>} />
    <Route path="/super-admin/subscriptions" element={<SuperAdminRoute><SuperAdminSubscriptions /></SuperAdminRoute>} />
    <Route path="/super-admin/analytics" element={<SuperAdminRoute><SuperAdminAnalytics /></SuperAdminRoute>} />
    <Route path="/super-admin/database" element={<SuperAdminRoute><SuperAdminDatabase /></SuperAdminRoute>} />
    <Route path="/super-admin/settings" element={<SuperAdminRoute><SuperAdminSettings /></SuperAdminRoute>} />
    <Route path="/super-admin/tenants" element={<SuperAdminRoute><TenantManagement /></SuperAdminRoute>} />

    {/* Admin Routes */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/properties" element={<AdminRoute><Properties /></AdminRoute>} />
    <Route path="/admin/tenants" element={<AdminRoute><Tenants /></AdminRoute>} />
    <Route path="/admin/units" element={<AdminRoute><Units /></AdminRoute>} />
    <Route path="/admin/billing" element={<AdminRoute><Billing /></AdminRoute>} />
    <Route path="/admin/payments" element={<AdminRoute><Payments /></AdminRoute>} />
    <Route path="/admin/tenant-management" element={<AdminRoute><TenantManagementUnified /></AdminRoute>} />
    <Route path="/admin/tenant-management/:tenantId" element={<AdminRoute><TenantManagementUnified mode="detail" /></AdminRoute>} />
    <Route path="/admin/tenant-wizard" element={<AdminRoute><TenantManagementUnified mode="wizard" /></AdminRoute>} />
    <Route path="/admin/payment-verification" element={<AdminRoute><PaymentVerification /></AdminRoute>} />
    <Route path="/admin/maintenance" element={<AdminRoute><Maintenance /></AdminRoute>} />
    <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
    <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
    <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
    <Route path="/admin/backend" element={<AdminRoute><BackendDashboard /></AdminRoute>} />
    <Route path="/admin/tenant-data" element={<AdminRoute><TenantDataListing /></AdminRoute>} />
    <Route path="/admin/inventory" element={<AdminRoute><InventoryManagement /></AdminRoute>} />
    <Route path="/admin/tenants/:tenantId" element={<AdminRoute><TenantDetail /></AdminRoute>} />

    {/* Manager Routes */}
    <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
    <Route path="/manager/properties" element={<ManagerRoute><Properties /></ManagerRoute>} />
    <Route path="/manager/tenants" element={<ManagerRoute><Tenants /></ManagerRoute>} />
    <Route path="/manager/units" element={<ManagerRoute><Units /></ManagerRoute>} />
    <Route path="/manager/billing" element={<ManagerRoute><Billing /></ManagerRoute>} />
    <Route path="/manager/payments" element={<ManagerRoute><Payments /></ManagerRoute>} />
    <Route path="/manager/maintenance" element={<ManagerRoute><Maintenance /></ManagerRoute>} />
    <Route path="/manager/settings" element={<ManagerRoute><Settings /></ManagerRoute>} />

    {/* Staff Routes */}
    <Route path="/staff" element={<StaffRoute><StaffDashboard /></StaffRoute>} />
    <Route path="/staff/properties" element={<StaffRoute><Properties /></StaffRoute>} />
    <Route path="/staff/maintenance" element={<StaffRoute><Maintenance /></StaffRoute>} />
    <Route path="/staff/units" element={<StaffRoute><Units /></StaffRoute>} />
    <Route path="/staff/settings" element={<StaffRoute><Settings /></StaffRoute>} />

    {/* User Routes */}
    <Route path="/user" element={<UserRoute><UserDashboard /></UserRoute>} />
    <Route path="/user/journey" element={<UserRoute><UserJourney /></UserRoute>} />
    <Route path="/user/properties" element={<UserRoute><Properties /></UserRoute>} />
    <Route path="/user/tenants" element={<UserRoute><Tenants /></UserRoute>} />
    <Route path="/user/units" element={<UserRoute><Units /></UserRoute>} />
    <Route path="/user/billing" element={<UserRoute><Billing /></UserRoute>} />
    <Route path="/user/payments" element={<UserRoute><Payments /></UserRoute>} />
    <Route path="/user/maintenance" element={<UserRoute><Maintenance /></UserRoute>} />
    <Route path="/user/settings" element={<UserRoute><Settings /></UserRoute>} />

    {/* Tenant Routes */}
    <Route path="/tenant" element={<TenantRoute><TenantDashboard /></TenantRoute>} />
    <Route path="/tenant/profile" element={<TenantRoute><TenantPersonalDetails /></TenantRoute>} />
    <Route path="/tenant/documents" element={<TenantRoute><TenantDocuments /></TenantRoute>} />
    <Route path="/tenant/family" element={<TenantRoute><TenantFamily /></TenantRoute>} />
    <Route path="/tenant/bills" element={<TenantRoute><TenantBills /></TenantRoute>} />
    <Route path="/tenant/payments" element={<TenantRoute><TenantPaymentsEnhanced /></TenantRoute>} />
    <Route path="/tenant/payments-enhanced" element={<TenantRoute><TenantPaymentsEnhanced /></TenantRoute>} />
    <Route path="/tenant/complaints" element={<TenantRoute><TenantComplaints /></TenantRoute>} />
    <Route path="/tenant/notifications" element={<TenantRoute><TenantNotifications /></TenantRoute>} />
    <Route path="/tenant/settings" element={<TenantRoute><TenantSettings /></TenantRoute>} />

    {/* Legacy Routes - Redirect to Role-specific Routes */}
    <Route path="/properties" element={<Navigate to="/admin/properties" replace />} />
    <Route path="/tenants" element={<Navigate to="/admin/tenants" replace />} />
    <Route path="/units" element={<Navigate to="/admin/units" replace />} />
    <Route path="/billing" element={<Navigate to="/admin/billing" replace />} />
    <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
    <Route path="/maintenance" element={<Navigate to="/admin/maintenance" replace />} />
    <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
    <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
    <Route path="/users" element={<Navigate to="/admin/users" replace />} />

    {/* 404 Route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Route constants for easy reference
export const ROUTES = {
  // Auth
  AUTH: "/auth",
  
  // Super Admin
  SUPER_ADMIN: {
    DASHBOARD: "/super-admin",
    USERS: "/super-admin/users",
    LOGS: "/super-admin/logs",
    ROLES: "/super-admin/roles",
    ORGANIZATIONS: "/super-admin/organizations",
    SUBSCRIPTIONS: "/super-admin/subscriptions",
    ANALYTICS: "/super-admin/analytics",
    DATABASE: "/super-admin/database",
    SETTINGS: "/super-admin/settings",
    TENANTS: "/super-admin/tenants",
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: "/admin",
    PROPERTIES: "/admin/properties",
    TENANTS: "/admin/tenants",
    UNITS: "/admin/units",
    BILLING: "/admin/billing",
    PAYMENTS: "/admin/payments",
    PAYMENT_VERIFICATION: "/admin/payment-verification",
    TENANT_MANAGEMENT: "/admin/tenant-management",
    TENANT_WIZARD: "/admin/tenant-wizard",
    MAINTENANCE: "/admin/maintenance",
    ANALYTICS: "/admin/analytics",
    SETTINGS: "/admin/settings",
    USERS: "/admin/users",
    BACKEND: "/admin/backend",
    TENANT_DATA: "/admin/tenant-data",
    INVENTORY: "/admin/inventory",
  },
  
  // Manager
  MANAGER: {
    DASHBOARD: "/manager",
    PROPERTIES: "/manager/properties",
    TENANTS: "/manager/tenants",
    UNITS: "/manager/units",
    BILLING: "/manager/billing",
    PAYMENTS: "/manager/payments",
    MAINTENANCE: "/manager/maintenance",
    SETTINGS: "/manager/settings",
  },
  
  // Staff
  STAFF: {
    DASHBOARD: "/staff",
    PROPERTIES: "/staff/properties",
    MAINTENANCE: "/staff/maintenance",
    UNITS: "/staff/units",
    SETTINGS: "/staff/settings",
  },
  
  // User
  USER: {
    DASHBOARD: "/user",
    JOURNEY: "/user/journey",
    PROPERTIES: "/user/properties",
    TENANTS: "/user/tenants",
    UNITS: "/user/units",
    BILLING: "/user/billing",
    PAYMENTS: "/user/payments",
    MAINTENANCE: "/user/maintenance",
    SETTINGS: "/user/settings",
  },
  
  // Tenant
  TENANT: {
    DASHBOARD: "/tenant",
    PROFILE: "/tenant/profile",
    DOCUMENTS: "/tenant/documents",
    FAMILY: "/tenant/family",
    BILLS: "/tenant/bills",
    PAYMENTS: "/tenant/payments",
    COMPLAINTS: "/tenant/complaints",
    NOTIFICATIONS: "/tenant/notifications",
    SETTINGS: "/tenant/settings",
  },
} as const;

export default AppRoutes;
