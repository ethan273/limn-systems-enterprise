"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  Users,
  Package,
  Factory,
  DollarSign,
  ChevronDown,
  ChevronRight,
  LogOutIcon,
  MenuIcon,
  XIcon,
  Palette,
  Building2,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavSubItem {
  label: string;
  href: string;
  badge?: number;
}

interface NavModule {
  label: string;
  icon: any;
  items: NavSubItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isOnTasksPage = pathname.startsWith('/tasks');

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "Dashboards": pathname === '/dashboard' || pathname.startsWith('/dashboards'),
    "Tasks": isOnTasksPage,
    "CRM": pathname.startsWith('/crm'),
    "Partners": pathname.startsWith('/partners'),
    "Design": pathname.startsWith('/design'),
    "Products": pathname.startsWith('/products'),
    "Production": pathname.startsWith('/production'),
    "Finance": pathname.startsWith('/finance'),
    "Admin": pathname.startsWith('/admin')
  });

  useEffect(() => {
    setExpandedModules({
      "Dashboards": pathname === '/dashboard' || pathname.startsWith('/dashboards'),
      "Tasks": pathname.startsWith('/tasks'),
      "CRM": pathname.startsWith('/crm'),
      "Partners": pathname.startsWith('/partners'),
      "Design": pathname.startsWith('/design'),
      "Products": pathname.startsWith('/products'),
      "Production": pathname.startsWith('/production'),
      "Finance": pathname.startsWith('/finance'),
      "Admin": pathname.startsWith('/admin')
    });
  }, [pathname]);

  const currentUserId = "f146d819-3eed-43e3-80af-835915a5cc14";

  const { data: allTasksData } = api.tasks.getAllTasks.useQuery({
    limit: 1,
    offset: 0,
  });

  const { data: myTasksData } = api.tasks.getMyTasks.useQuery({
    user_id: currentUserId,
    limit: 1,
    offset: 0,
    includeWatching: false,
  });

  const allTasksCount = allTasksData?.total || 0;
  const myTasksCount = myTasksData?.total || 0;

  const navigationModules: NavModule[] = [
    {
      label: "Dashboards",
      icon: BarChart3,
      items: [
        { label: "Main Dashboard", href: "/dashboard" },
        { label: "Analytics Dashboard", href: "/dashboards/analytics" },
        { label: "Executive Dashboard", href: "/dashboards/executive" },
        { label: "Project Dashboard", href: "/dashboards/projects" },
      ]
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      items: [
        { label: "All Tasks", href: "/tasks", badge: allTasksCount > 0 ? allTasksCount : undefined },
        { label: "My Tasks", href: "/tasks/my", badge: myTasksCount > 0 ? myTasksCount : undefined },
        { label: "Manufacturer Tasks", href: "/tasks/manufacturer" },
        { label: "Designer Tasks", href: "/tasks/designer" },
        { label: "Client Tasks", href: "/tasks/client" },
      ]
    },
    {
      label: "CRM",
      icon: Users,
      items: [
        { label: "Contacts", href: "/crm/contacts" },
        { label: "Leads", href: "/crm/leads" },
        { label: "Prospects", href: "/crm/prospects" },
        { label: "Clients", href: "/crm/clients" },
        { label: "Projects", href: "/crm/projects" },
        { label: "Orders", href: "/crm/orders" },
      ]
    },
    {
      label: "Partners",
      icon: Building2,
      items: [
        { label: "Designers", href: "/partners/designers" },
        { label: "Factories", href: "/partners/factories" },
      ]
    },
    {
      label: "Design",
      icon: Palette,
      items: [
        { label: "Design Briefs", href: "/design/briefs" },
        { label: "Design Projects", href: "/design/projects" },
        { label: "Mood Boards", href: "/design/boards" },
        { label: "Documents", href: "/design/documents" },
      ]
    },
    {
      label: "Products",
      icon: Package,
      items: [
        { label: "Collections", href: "/products/collections" },
        { label: "Materials", href: "/products/materials" },
        { label: "Concepts", href: "/products/concepts" },
        { label: "Prototypes", href: "/products/prototypes" },
        { label: "Catalog", href: "/products/catalog" },
        { label: "Ordered", href: "/products/ordered-items" },
      ]
    },
    {
      label: "Production",
      icon: Factory,
      items: [
        { label: "Dashboard", href: "/production/dashboard" },
        { label: "Production Orders", href: "/production/orders" },
        { label: "Shop Drawings", href: "/production/shop-drawings" },
        { label: "Prototypes", href: "/production/prototypes" },
        { label: "Factory Reviews", href: "/production/factory-reviews" },
        { label: "QC Inspections", href: "/production/qc" },
        { label: "Packing & Shipping", href: "/production/packing" },
      ]
    },
    {
      label: "Finance",
      icon: DollarSign,
      items: [
        { label: "Dashboard", href: "/finance" },
      ]
    },
    {
      label: "Admin",
      icon: Shield,
      items: [
        { label: "Approvals", href: "/admin/approvals" },
      ]
    }
  ];

  const toggleModule = (moduleLabel: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleLabel]: !Object.prototype.hasOwnProperty.call(prev, moduleLabel) || !prev[moduleLabel as keyof typeof prev]
    }));
  };

  const isItemActive = (href: string) => {
    if (href === pathname) return true;
    if (pathname.startsWith(href + '/')) {
      const pathSegments = pathname.split('/').filter(Boolean);
      const hrefSegments = href.split('/').filter(Boolean);
      if (hrefSegments.length >= pathSegments.length) return false;
      return true;
    }
    return false;
  };

  const isModuleActive = (module: NavModule) => {
    return module.items.some(item => isItemActive(item.href));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-menu-button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XIcon className="w-6 h-6" aria-hidden="true" />
        ) : (
          <MenuIcon className="w-6 h-6" aria-hidden="true" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn("sidebar", !isOpen && "sidebar-hidden")}>
        {/* Logo */}
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-container">
            <h1 className="sidebar-logo-text">
              Limn Systems
            </h1>
            <ThemeToggle />
          </div>
          <p className="sidebar-subtitle">Enterprise Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav space-y-2">
          {navigationModules.map((module) => {
            const Icon = module.icon;
            const isModuleExpanded = expandedModules[module.label];
            const moduleActive = isModuleActive(module);

            return (
              <div key={module.label} className="nav-module">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.label)}
                  className={cn(
                    "nav-module-header",
                    moduleActive ? "nav-module-header-active" : "nav-module-header-inactive"
                  )}
                >
                  <div className="nav-module-icon-text">
                    <Icon className="nav-module-icon" />
                    <span className="nav-module-label">{module.label}</span>
                  </div>
                  {isModuleExpanded ? (
                    <ChevronDown className="nav-module-chevron" />
                  ) : (
                    <ChevronRight className="nav-module-chevron" />
                  )}
                </button>

                {/* Sub-navigation */}
                {isModuleExpanded && (
                  <div className="nav-subnav space-y-1">
                    {module.items.map((item) => {
                      const isActive = isItemActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "nav-subitem",
                            isActive ? "nav-subitem-active" : "nav-subitem-inactive"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={cn(
                              "nav-badge",
                              isActive ? "nav-badge-active" : "nav-badge-inactive"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="sidebar-user-section">
          <div className="user-profile">
            <div className="user-avatar">
              JD
            </div>
            <div className="user-info">
              <p className="user-name">John Doe</p>
              <p className="user-email">john@example.com</p>
            </div>
            <LogOutIcon className="user-logout-icon" />
          </div>
        </div>
      </aside>
    </>
  );
}
