import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  CreditCard,
  Database,
  Activity,
  Settings,
  BarChart3,
  TrendingUp,
  Globe,
  Lock,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navSections = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", path: "/super-admin", icon: LayoutDashboard, badge: null },
      { title: "Analytics", path: "/super-admin/analytics", icon: BarChart3, badge: "New" },
    ]
  },
  {
    title: "Management",
    items: [
      { title: "Users", path: "/super-admin/users", icon: Users, badge: null },
      { title: "Roles & Permissions", path: "/super-admin/roles", icon: Shield, badge: null },
      { title: "Organizations", path: "/super-admin/organizations", icon: Building2, badge: null },
    ]
  },
  {
    title: "Operations",
    items: [
      { title: "Subscriptions", path: "/super-admin/subscriptions", icon: CreditCard, badge: null },
      { title: "Activity Logs", path: "/super-admin/logs", icon: Activity, badge: "Live" },
      { title: "Database", path: "/super-admin/database", icon: Database, badge: null },
    ]
  },
  {
    title: "System",
    items: [
      { title: "Settings", path: "/super-admin/settings", icon: Settings, badge: null },
      { title: "Security", path: "/super-admin/security", icon: Lock, badge: null },
      { title: "Documentation", path: "/super-admin/docs", icon: FileText, badge: null },
    ]
  }
];

export function SuperAdminSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 68 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-screen bg-gradient-to-b from-card to-card/95 border-r border-border/50 flex flex-col z-40 backdrop-blur-sm"
      >
        {/* Enhanced Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border/50 bg-gradient-to-r from-destructive/5 to-transparent">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 overflow-hidden w-full text-left hover:bg-muted/50 rounded-lg p-2 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shrink-0 shadow-lg">
                  <ShieldAlert className="w-5 h-5 text-destructive-foreground" />
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex flex-col items-start"
                    >
                      <span className="text-lg font-bold bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">
                        Super Admin
                      </span>
                      <span className="text-xs text-muted-foreground">Platform Control</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/super-admin/organizations")}>
                <Globe className="w-4 h-4 mr-2" />
                My Workspace
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/super-admin/organizations?create=1")}>
                <Building2 className="w-4 h-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/super-admin/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/super-admin/docs")}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Docs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-2">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  className="px-3 py-1"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </span>
                </motion.div>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Tooltip key={item.path} delayDuration={sidebarCollapsed ? 0 : 1000}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                            "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5",
                            isActive
                              ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary shadow-sm border border-primary/20"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "relative flex items-center justify-center w-5 h-5",
                            isActive && "text-primary"
                          )}>
                            <item.icon className={cn(
                              "w-5 h-5 shrink-0 transition-transform duration-200",
                              isActive && "scale-110",
                              "group-hover:scale-105"
                            )} />
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute inset-0 bg-primary/20 rounded-md blur-sm"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                          </div>
                          <AnimatePresence>
                            {!sidebarCollapsed && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-2 flex-1"
                              >
                                <span className="whitespace-nowrap">{item.title}</span>
                                {item.badge && (
                                  <Badge
                                    variant={item.badge === "Live" ? "destructive" : "secondary"}
                                    className="text-xs px-1.5 py-0.5 h-auto"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {isActive && !sidebarCollapsed && (
                            <motion.div
                              className="w-1 h-6 bg-primary rounded-full"
                              layoutId="activeTab"
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover border-border">
                        <p>{item.title}</p>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Enhanced Collapse Button */}
        <div className="p-3 border-t border-border/50 bg-gradient-to-t from-muted/20 to-transparent">
          <Tooltip delayDuration={sidebarCollapsed ? 0 : 1000}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group"
              >
                <motion.div
                  animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </motion.div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm group-hover:text-primary transition-colors"
                    >
                      Collapse
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border-border">
              <p>{sidebarCollapsed ? "Expand" : "Collapse"} sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
