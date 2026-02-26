import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Home,
  Users,
  Building2,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  Settings,
  Database,
  List,
  Package,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Eye
} from "lucide-react"

interface NavigationItem {
  title: string
  href: string
  icon: any
  description?: string
  badge?: string
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
    description: "Main admin dashboard"
  },
  {
    title: "Tenant Management",
    href: "/admin/tenants",
    icon: Users,
    description: "Manage tenant accounts",
    children: [
      {
        title: "Tenant List",
        href: "/admin/tenants",
        icon: List,
        description: "View all tenants"
      },
      {
        title: "Tenant Data Listing",
        href: "/admin/tenant-data",
        icon: List,
        description: "Complete tenant data listing"
      }
    ]
  },
  {
    title: "Property Management",
    href: "/admin/properties",
    icon: Building2,
    description: "Manage properties and units",
    children: [
      {
        title: "Properties",
        href: "/admin/properties",
        icon: Building2,
        description: "Property management"
      },
      {
        title: "Units",
        href: "/admin/units",
        icon: Building2,
        description: "Unit management"
      }
    ]
  },
  {
    title: "Inventory Management",
    href: "/admin/inventory",
    icon: Package,
    description: "Manage inventory items",
    badge: "New"
  },
  {
    title: "Financial Management",
    href: "/admin/billing",
    icon: CreditCard,
    description: "Billing and payments",
    children: [
      {
        title: "Billing",
        href: "/admin/billing",
        icon: FileText,
        description: "Invoice management"
      },
      {
        title: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
        description: "Payment tracking"
      },
      {
        title: "Payment Verification",
        href: "/admin/payment-verification",
        icon: Eye,
        description: "Verify QR and cash payments"
      }
    ]
  },
  {
    title: "Maintenance",
    href: "/admin/maintenance",
    icon: Wrench,
    description: "Maintenance requests"
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Reports and analytics"
  },
  {
    title: "System",
    href: "/admin/backend",
    icon: Database,
    description: "Backend system status",
    children: [
      {
        title: "Backend Dashboard",
        href: "/admin/backend",
        icon: Database,
        description: "Backend service status"
      }
    ]
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "System settings",
    children: [
      {
        title: "General Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "System configuration"
      },
      {
        title: "User Management",
        href: "/admin/users",
        icon: Users,
        description: "User account management"
      }
    ]
  }
]

interface AdminNavigationProps {
  className?: string
}

export function AdminNavigation({ className }: AdminNavigationProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const active = isActive(item.href)

    return (
      <div key={item.title} className="space-y-1">
        <Link
          to={item.href}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            level > 0 && "pl-6"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title)
            }
            if (window.innerWidth < 768) {
              setIsMobileMenuOpen(false)
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </Link>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children?.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const NavigationContent = () => (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Admin Panel
        </h2>
        <div className="space-y-1">
          {navigationItems.map((item) => renderNavigationItem(item))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Navigation */}
      <div className={cn("hidden md:block", className)}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/admin" className="flex items-center space-x-2 font-bold">
              <Building2 className="h-6 w-6" />
              <span>Admin Panel</span>
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <NavigationContent />
          </ScrollArea>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link 
                to="/admin" 
                className="flex items-center space-x-2 font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Building2 className="h-6 w-6" />
                <span>Admin Panel</span>
              </Link>
            </div>
            <ScrollArea className="flex-1">
              <NavigationContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

// Admin Layout Component
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 border-r bg-muted/40">
        <AdminNavigation />
      </div>
      <div className="flex-1 flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="md:hidden">
            <AdminNavigation />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold md:text-2xl">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
