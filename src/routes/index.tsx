import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { UserRoute } from "@/components/auth/UserRoute";
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

// Admin Pages
import AdminDashboard from "@/pages/AdminDashboard";
import Properties from "@/pages/Properties";
import Units from "@/pages/Units";
import Billing from "@/pages/Billing";
import Payments from "@/pages/Payments";
import Maintenance from "@/pages/Maintenance";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { UserManagement } from "@/pages/UserManagement";
import { BackendDashboard } from "@/pages/BackendDashboard";
import { InventoryManagement } from "@/pages/InventoryManagement";
import PaymentVerification from "@/pages/admin/PaymentVerification";

// Manager Pages
import ManagerDashboard from "@/pages/ManagerDashboard";

// Staff Pages
import StaffDashboard from "@/pages/StaffDashboard";

// User Pages
import UserDashboard from "@/pages/UserDashboard";
import UserJourney from "@/pages/UserJourney";


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

    {/* Admin Routes */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/properties" element={<AdminRoute><Properties /></AdminRoute>} />
    <Route path="/admin/units" element={<AdminRoute><Units /></AdminRoute>} />
    <Route path="/admin/billing" element={<AdminRoute><Billing /></AdminRoute>} />
    <Route path="/admin/payments" element={<AdminRoute><Payments /></AdminRoute>} />
    <Route path="/admin/payment-verification" element={<AdminRoute><PaymentVerification /></AdminRoute>} />
    <Route path="/admin/maintenance" element={<AdminRoute><Maintenance /></AdminRoute>} />
    <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
    <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
    <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
    <Route path="/admin/backend" element={<AdminRoute><BackendDashboard /></AdminRoute>} />
    <Route path="/admin/inventory" element={<AdminRoute><InventoryManagement /></AdminRoute>} />

    {/* Manager Routes */}
    <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
    <Route path="/manager/properties" element={<ManagerRoute><Properties /></ManagerRoute>} />
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
    <Route path="/user/units" element={<UserRoute><Units /></UserRoute>} />
    <Route path="/user/billing" element={<UserRoute><Billing /></UserRoute>} />
    <Route path="/user/payments" element={<UserRoute><Payments /></UserRoute>} />
    <Route path="/user/maintenance" element={<UserRoute><Maintenance /></UserRoute>} />
    <Route path="/user/settings" element={<UserRoute><Settings /></UserRoute>} />


    {/* Legacy Routes - Redirect to Role-specific Routes */}
    <Route path="/properties" element={<Navigate to="/admin/properties" replace />} />
    <Route path="/tenants" element={<Navigate to="/admin/properties" replace />} />
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
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: "/admin",
    PROPERTIES: "/admin/properties",
    UNITS: "/admin/units",
    BILLING: "/admin/billing",
    PAYMENTS: "/admin/payments",
    MAINTENANCE: "/admin/maintenance",
    ANALYTICS: "/admin/analytics",
    SETTINGS: "/admin/settings",
    USERS: "/admin/users",
    BACKEND: "/admin/backend",
    INVENTORY: "/admin/inventory",
  },
  
  // Manager
  MANAGER: {
    DASHBOARD: "/manager",
    PROPERTIES: "/manager/properties",
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
    UNITS: "/user/units",
    BILLING: "/user/billing",
    PAYMENTS: "/user/payments",
    MAINTENANCE: "/user/maintenance",
    SETTINGS: "/user/settings",
  },
  
} as const;

export default AppRoutes;
