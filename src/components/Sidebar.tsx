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
  XIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";

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
  // Keep Tasks expanded if we're on any Tasks page
  const isOnTasksPage = pathname.startsWith('/tasks');

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "Dashboards": pathname === '/dashboard' || pathname.startsWith('/dashboards'),
    "Tasks": isOnTasksPage,
    "Products": pathname.startsWith('/products'),
    "CRM": pathname.startsWith('/crm'),
    "Production": pathname.startsWith('/production'),
    "Finance": pathname.startsWith('/finance')
  });

  // Update expanded modules when pathname changes to keep relevant module open
  useEffect(() => {
    setExpandedModules({
      "Dashboards": pathname === '/dashboard' || pathname.startsWith('/dashboards'),
      "Tasks": pathname.startsWith('/tasks'),
      "Products": pathname.startsWith('/products'),
      "CRM": pathname.startsWith('/crm'),
      "Production": pathname.startsWith('/production'),
      "Finance": pathname.startsWith('/finance')
    });
  }, [pathname]);

  // Current user ID - in production this would come from session
  const currentUserId = "f146d819-3eed-43e3-80af-835915a5cc14";

  // Get all tasks count
  const { data: allTasksData } = api.tasks.getAllTasks.useQuery({
    limit: 1,
    offset: 0,
  });

  // Get my tasks count
  const { data: myTasksData } = api.tasks.getMyTasks.useQuery({
    user_id: currentUserId,
    limit: 1,
    offset: 0,
    includeWatching: false,
  });

  // Calculate counts with safety checks
  const allTasksCount = allTasksData?.total || 0;
  const myTasksCount = myTasksData?.total || 0;

  // Dynamic navigation modules with real data
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
        { label: "Orders", href: "/production/orders" },
      ]
    },
    {
      label: "Finance",
      icon: DollarSign,
      items: [
        { label: "Dashboard", href: "/finance" },
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
    // Use exact matching for navigation items to avoid conflicts between /tasks and /tasks/my
    return href === pathname;
  };

  const isModuleActive = (module: NavModule) => {
    return module.items.some(item => isItemActive(item.href));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        {isOpen ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <MenuIcon className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40 transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Limn Systems
          </h1>
          <p className="text-xs text-gray-500 mt-1">Enterprise Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-200px)]">
          {navigationModules.map((module) => {
            const Icon = module.icon;
            const isModuleExpanded = expandedModules[module.label];
            const moduleActive = isModuleActive(module);

            return (
              <div key={module.label} className="space-y-1">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    moduleActive
                      ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{module.label}</span>
                  </div>
                  {isModuleExpanded ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                  )}
                </button>

                {/* Sub-navigation */}
                {isModuleExpanded && (
                  <div className="ml-4 space-y-1 border-l border-gray-700 pl-3">
                    {module.items.map((item) => {
                      const isActive = isItemActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 text-sm",
                            isActive
                              ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 font-medium"
                              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              isActive
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-gray-700 text-gray-300"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-sm font-bold">
              JD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
            <LogOutIcon className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </aside>
    </>
  );
}