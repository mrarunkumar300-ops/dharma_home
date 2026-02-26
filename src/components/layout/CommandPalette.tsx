import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Settings,
  BarChart3,
  Wrench,
  CreditCard,
  DoorOpen,
  User,
  FileText,
  Shield,
  Database,
  UserCog,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { useUserRole } from "@/hooks/useUserRole";

interface Command {
  label: string;
  icon: any;
  path: string;
}

const superAdminCommands: Command[] = [
  { label: "Super Admin Dashboard", icon: LayoutDashboard, path: "/super-admin" },
  { label: "Users", icon: Users, path: "/super-admin/users" },
  { label: "Organizations", icon: Building2, path: "/super-admin/organizations" },
  { label: "Roles", icon: Shield, path: "/super-admin/roles" },
  { label: "Analytics", icon: BarChart3, path: "/super-admin/analytics" },
  { label: "Database", icon: Database, path: "/super-admin/database" },
  { label: "Activity Logs", icon: FileText, path: "/super-admin/logs" },
  { label: "Settings", icon: Settings, path: "/super-admin/settings" },
];

const adminCommands: Command[] = [
  { label: "Admin Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Properties", icon: Building2, path: "/admin/properties" },
  { label: "Units", icon: DoorOpen, path: "/admin/units" },
  { label: "Tenants", icon: Users, path: "/admin/tenants" },
  { label: "Billing", icon: Receipt, path: "/admin/billing" },
  { label: "Payments", icon: CreditCard, path: "/admin/payments" },
  { label: "Maintenance", icon: Wrench, path: "/admin/maintenance" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "User Management", icon: UserCog, path: "/admin/users" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const managerCommands: Command[] = [
  { label: "Manager Dashboard", icon: LayoutDashboard, path: "/manager" },
  { label: "Properties", icon: Building2, path: "/manager/properties" },
  { label: "Units", icon: DoorOpen, path: "/manager/units" },
  { label: "Tenants", icon: Users, path: "/manager/tenants" },
  { label: "Billing", icon: Receipt, path: "/manager/billing" },
  { label: "Payments", icon: CreditCard, path: "/manager/payments" },
  { label: "Maintenance", icon: Wrench, path: "/manager/maintenance" },
  { label: "Settings", icon: Settings, path: "/manager/settings" },
];

const tenantCommands: Command[] = [
  { label: "My Dashboard", icon: LayoutDashboard, path: "/tenant" },
  { label: "Personal Details", icon: User, path: "/tenant/profile" },
  { label: "My Documents", icon: FileText, path: "/tenant/documents" },
  { label: "Family Members", icon: Users, path: "/tenant/family" },
  { label: "My Bills", icon: CreditCard, path: "/tenant/bills" },
  { label: "Payment History", icon: Receipt, path: "/tenant/payments" },
  { label: "Settings", icon: Settings, path: "/tenant/settings" },
];

const userCommands: Command[] = [
  { label: "My Dashboard", icon: LayoutDashboard, path: "/user" },
  { label: "Properties", icon: Building2, path: "/user/properties" },
  { label: "Units", icon: DoorOpen, path: "/user/units" },
  { label: "Tenants", icon: Users, path: "/user/tenants" },
  { label: "Billing", icon: Receipt, path: "/user/billing" },
  { label: "Payments", icon: CreditCard, path: "/user/payments" },
  { label: "Maintenance", icon: Wrench, path: "/user/maintenance" },
  { label: "Settings", icon: Settings, path: "/user/settings" },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isManager, isTenant } = useUserRole();

  const commands = isSuperAdmin
    ? superAdminCommands
    : isAdmin
    ? adminCommands
    : isManager
    ? managerCommands
    : isTenant
    ? tenantCommands
    : userCommands;

  const handleSelect = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {commands.map((cmd) => (
            <CommandItem
              key={cmd.path}
              onSelect={() => handleSelect(cmd.path)}
              className="gap-3 rounded-lg"
            >
              <cmd.icon className="w-4 h-4 text-muted-foreground" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
