import { Search, ChevronDown, User, LogOut, Settings as SettingsIcon, UserCircle, IndianRupee, DollarSign } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useCurrency } from "@/hooks/useCurrency";
import { Link, useNavigate } from "react-router-dom";
import { NotificationDropdown } from "./NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const { setCommandPaletteOpen } = useAppStore();
  const { signOut, profile } = useAuth();
  const { isAdmin, isManager, isTenant, isSuperAdmin } = useUserRole();
  const { currency, setCurrency, getCurrencySymbol } = useCurrency();
  const navigate = useNavigate();

  const settingsPath = isSuperAdmin ? "/super-admin/settings" : isAdmin ? "/admin/settings" : isManager ? "/manager/settings" : isTenant ? "/tenant/settings" : "/user/settings";
  const workspacePath = isSuperAdmin ? "/super-admin/organizations" : settingsPath;
  const createWorkspacePath = isSuperAdmin ? "/super-admin/organizations?create=1" : settingsPath;

  return (
    <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-colors w-72"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <kbd className="ml-auto text-xs bg-background/80 px-2 py-0.5 rounded-md border border-border/50 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Currency Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-xl gap-1 px-3 h-9 text-muted-foreground hover:text-foreground">
              {currency === 'INR' ? <IndianRupee className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              <span className="text-sm font-medium">{currency}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl glass-card">
            <DropdownMenuItem
              className="rounded-lg cursor-pointer gap-2"
              onClick={() => setCurrency('INR')}
            >
              <IndianRupee className="w-4 h-4" />
              INR - Indian Rupee
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg cursor-pointer gap-2"
              onClick={() => setCurrency('USD')}
            >
              <DollarSign className="w-4 h-4" />
              USD - US Dollar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link to={settingsPath}>
              <DropdownMenuItem className="rounded-lg cursor-pointer text-xs text-muted-foreground">
                Currency Settings
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Workspace */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-xl gap-2 text-muted-foreground">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {profile?.full_name?.charAt(0) || "A"}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                {profile?.full_name || "Workspace"}
              </span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl glass-card">
            <DropdownMenuItem
              className="rounded-lg cursor-pointer"
              onClick={() => navigate(workspacePath)}
            >
              My Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg cursor-pointer"
              onClick={() => navigate(createWorkspacePath)}
            >
              Create workspace...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl glass-card">
            <Link to={settingsPath}>
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link to={settingsPath}>
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
