import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes";
import { 
  Building2, 
  Users, 
  Home, 
  CreditCard, 
  DollarSign, 
  Wrench, 
  BarChart3, 
  Settings,
  UserPlus,
  Shield,
  UserCog,
  User,
  FileText,
  Briefcase,
  Eye,
  Bell,
  Database,
  List,
  Package,
  QrCode,
  Book
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permission?: any;
  role?: 'admin' | 'manager' | 'user' | 'tenant' | 'staff' | 'guest';
  divider?: boolean;
}

export const RoleBasedNav = () => {
  const { hasPermission } = usePermissions();
  const { isAdmin, isManager, isUser, isTenant, isStaff, isGuest } = useUserRole();
  const location = useLocation();

  const adminNavigationItems: NavItem[] = [
    {
      name: "Admin Dashboard",
      href: ROUTES.ADMIN.DASHBOARD,
      icon: Home,
      role: 'admin'
    },
    {
      name: "Properties",
      href: ROUTES.ADMIN.PROPERTIES,
      icon: Building2,
      permission: "view_properties" as const,
      role: 'admin'
    },
    {
      name: "Tenants",
      href: ROUTES.ADMIN.TENANTS,
      icon: Users,
      permission: "view_tenants" as const,
      role: 'admin'
    },
    {
      name: "Units",
      href: ROUTES.ADMIN.UNITS,
      icon: Building2,
      permission: "view_units" as const,
      role: 'admin'
    },
    {
      name: "Billing",
      href: ROUTES.ADMIN.BILLING,
      icon: CreditCard,
      permission: "view_billing" as const,
      role: 'admin'
    },
    {
      name: "Payments",
      href: ROUTES.ADMIN.PAYMENTS,
      icon: DollarSign,
      permission: "view_payments" as const,
      role: 'admin'
    },
    {
      name: "Payment Verification",
      href: ROUTES.ADMIN.PAYMENT_VERIFICATION,
      icon: QrCode,
      role: 'admin'
    },
    {
      name: "Maintenance",
      href: ROUTES.ADMIN.MAINTENANCE,
      icon: Wrench,
      permission: "view_maintenance" as const,
      role: 'admin'
    },
    {
      name: "Analytics",
      href: ROUTES.ADMIN.ANALYTICS,
      icon: BarChart3,
      permission: "view_analytics" as const,
      role: 'admin'
    },
    {
      name: "Settings",
      href: ROUTES.ADMIN.SETTINGS,
      icon: Settings,
      permission: "view_settings" as const,
      role: 'admin'
    },
    {
      name: "Inventory",
      href: ROUTES.ADMIN.INVENTORY,
      icon: Package,
      role: 'admin'
    },
    {
      name: "Tenant Data",
      href: ROUTES.ADMIN.TENANT_DATA,
      icon: List,
      role: 'admin'
    },
    {
      name: "Backend",
      href: ROUTES.ADMIN.BACKEND,
      icon: Database,
      role: 'admin',
      divider: true
    },
    {
      name: "Tenant Management",
      href: ROUTES.ADMIN.TENANT_MANAGEMENT,
      icon: Users,
      role: 'admin'
    },
  ];

  const managerNavigationItems: NavItem[] = [
    { name: "Manager Dashboard", href: "/manager", icon: Home, role: 'manager' },
    { name: "Properties", href: "/manager/properties", icon: Building2, permission: "view_properties" as const, role: 'manager' },
    { name: "Tenants", href: "/manager/tenants", icon: Users, permission: "view_tenants" as const, role: 'manager' },
    { name: "Units", href: "/manager/units", icon: Home, permission: "view_units" as const, role: 'manager' },
    { name: "Billing", href: "/manager/billing", icon: CreditCard, permission: "view_billing" as const, role: 'manager' },
    { name: "Payments", href: "/manager/payments", icon: DollarSign, permission: "view_payments" as const, role: 'manager' },
    { name: "Maintenance", href: "/manager/maintenance", icon: Wrench, permission: "view_maintenance" as const, role: 'manager' },
    { name: "Settings", href: "/manager/settings", icon: Settings, permission: "view_settings" as const, role: 'manager' },
  ];

  const userNavigationItems: NavItem[] = [
    { name: "My Dashboard", href: "/user", icon: Home, role: 'user' },
    { name: "My Properties", href: "/user/properties", icon: Building2, permission: "view_properties" as const, role: 'user' },
    { name: "My Tenants", href: "/user/tenants", icon: Users, permission: "view_tenants" as const, role: 'user' },
    { name: "My Units", href: "/user/units", icon: Home, permission: "view_units" as const, role: 'user' },
    { name: "Billing", href: "/user/billing", icon: CreditCard, permission: "view_billing" as const, role: 'user' },
    { name: "Payments", href: "/user/payments", icon: DollarSign, permission: "view_payments" as const, role: 'user' },
    { name: "Maintenance", href: "/user/maintenance", icon: Wrench, permission: "view_maintenance" as const, role: 'user' },
    { name: "Settings", href: "/user/settings", icon: Settings, permission: "view_settings" as const, role: 'user' },
  ];

  const tenantNavigationItems: NavItem[] = [
    {
      name: "My Dashboard",
      href: ROUTES.TENANT.DASHBOARD,
      icon: Home,
      role: 'tenant'
    },
    {
      name: "Personal Details",
      href: ROUTES.TENANT.PROFILE,
      icon: User,
      permission: "tenant_profile" as const,
      role: 'tenant'
    },
    {
      name: "My Documents",
      href: ROUTES.TENANT.DOCUMENTS,
      icon: FileText,
      permission: "tenant_documents" as const,
      role: 'tenant'
    },
    {
      name: "Family Members",
      href: ROUTES.TENANT.FAMILY,
      icon: Users,
      permission: "tenant_family_members" as const,
      role: 'tenant'
    },
    {
      name: "My Bills",
      href: ROUTES.TENANT.BILLS,
      icon: CreditCard,
      permission: "tenant_bills" as const,
      role: 'tenant'
    },
    {
      name: "Online Payments",
      href: ROUTES.TENANT.PAYMENTS_ENHANCED,
      icon: DollarSign,
      permission: "tenant_payments" as const,
      role: 'tenant'
    },
    {
      name: "Complaints",
      href: ROUTES.TENANT.COMPLAINTS,
      icon: Wrench,
      permission: "tenant_complaints" as const,
      role: 'tenant'
    },
    {
      name: "Notifications",
      href: ROUTES.TENANT.NOTIFICATIONS,
      icon: Bell,
      permission: "tenant_notifications" as const,
      role: 'tenant'
    },
    {
      name: "Settings",
      href: ROUTES.TENANT.SETTINGS,
      icon: Settings,
      permission: "tenant_profile" as const,
      role: 'tenant'
    }
  ];

  const staffNavigationItems: NavItem[] = [
    { name: "Staff Dashboard", href: "/staff", icon: Home, role: 'staff' },
    { name: "Properties", href: "/staff/properties", icon: Building2, permission: "view_properties" as const, role: 'staff' },
    { name: "Maintenance", href: "/staff/maintenance", icon: Wrench, permission: "view_maintenance" as const, role: 'staff' },
    { name: "Units", href: "/staff/units", icon: Home, permission: "view_units" as const, role: 'staff' },
    { name: "Settings", href: "/staff/settings", icon: Settings, permission: "view_settings" as const, role: 'staff' },
  ];

  const guestNavigationItems: NavItem[] = [
    { name: "Guest Dashboard", href: "/guest", icon: Home, role: 'guest' },
    { name: "Properties", href: "/guest/properties", icon: Building2, permission: "view_properties" as const, role: 'guest' },
    { name: "Settings", href: "/guest/settings", icon: Settings, permission: "view_settings" as const, role: 'guest' },
  ];

  const navigationItems = isAdmin ? adminNavigationItems : isManager ? managerNavigationItems : isStaff ? staffNavigationItems : isTenant ? tenantNavigationItems : isGuest ? guestNavigationItems : userNavigationItems;

  const filteredItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
      {filteredItems.map((item, index) => {
        const isActive = location.pathname === item.href;
        return (
          <div key={item.href}>
            <Link
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                item.divider && index > 0 ? "mt-6 pt-6 border-t border-border/50" : ""
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              <span className="text-sm font-medium whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          </div>
        );
      })}

      {/* Role indicator */}
      <div className="pt-6 border-t border-border/50 mt-6">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Shield className="w-3 h-3" />
            Your Role
          </div>
          <div className="flex flex-wrap gap-1">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                <UserPlus className="w-3 h-3" />
                Admin
              </span>
            )}
            {isManager && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <UserCog className="w-3 h-3" />
                Manager
              </span>
            )}
            {!isAdmin && !isManager && !isTenant && !isStaff && !isGuest && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                <Users className="w-3 h-3" />
                User
              </span>
            )}
            {isTenant && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                <Home className="w-3 h-3" />
                Tenant
              </span>
            )}
            {isStaff && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                <Briefcase className="w-3 h-3" />
                Staff
              </span>
            )}
            {isGuest && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 border border-gray-500/20">
                <Eye className="w-3 h-3" />
                Guest
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
