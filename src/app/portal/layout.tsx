'use client';

/**
 * Client Portal Layout
 * Phase 3: Customer Self-Service Portal
 * Provides navigation, authentication, and layout structure
 */

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
 LayoutDashboard,
 ShoppingCart,
 FileText,
 User,
 CreditCard,
 Truck,
 Bell,
 Menu,
 X,
 LogOut,
 Loader2,
} from 'lucide-react';
import { api } from '@/lib/api/client';

interface LayoutProps {
 children: React.ReactNode;
}

export default function PortalLayout({ children }: LayoutProps) {
 const router = useRouter();
 const pathname = usePathname();
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [signingOut, setSigningOut] = useState(false);

 // Get user info from tRPC - middleware already validated auth
 const { data: userInfo } = api.portal.getCurrentUser.useQuery();

 // Fetch portal settings to determine navigation
 const { data: portalSettings } = api.portal.getPortalSettings.useQuery();

 // Fetch notification count
 const { data: notificationData } = api.portal.getNotifications.useQuery(
 { limit: 1, offset: 0, read: false },
 {
 refetchInterval: 30000, // Refetch every 30 seconds
 }
 );

 const handleSignOut = async () => {
 try {
 setSigningOut(true);
 const supabase = createClient();
 await supabase.auth.signOut();
 router.push('/portal/login');
 router.refresh();
 } catch (error) {
 console.error('Sign out error:', error);
 setSigningOut(false);
 }
 };

 // Don't show layout on login page
 if (pathname === '/portal/login') {
 return <>{children}</>;
 }

 const navigation = [
 { name: 'Dashboard', href: '/portal', icon: LayoutDashboard, show: true },
 { name: 'Orders', href: '/portal/orders', icon: ShoppingCart, show: true },
 {
 name: 'Shipping',
 href: '/portal/shipping',
 icon: Truck,
 show: portalSettings?.show_shipping_info,
 },
 {
 name: 'Financials',
 href: '/portal/financials',
 icon: CreditCard,
 show: portalSettings?.show_financial_details,
 },
 { name: 'Documents', href: '/portal/documents', icon: FileText, show: true },
 { name: 'Profile', href: '/portal/profile', icon: User, show: true },
 ].filter((item) => item.show);

 const unreadCount = notificationData?.unreadCount || 0;

 return (
 <div className="min-h-screen card">
 {/* Mobile sidebar overlay */}
 {sidebarOpen && (
 <div
 className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
 onClick={() => setSidebarOpen(false)}
 />
 )}

 {/* Sidebar */}
 <aside
 className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg border-r border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
 sidebarOpen ? 'translate-x-0' : '-translate-x-full'
 }`}
 >
 <div className="flex flex-col h-full">
 {/* Logo Header */}
 <div className="flex items-center justify-between h-16 px-6 border-b border">
 <div className="flex items-center">
 <div className="w-8 h-8 bg-[#91bdbd] rounded-full flex items-center justify-center">
 <span className="text-foreground text-sm font-bold">L</span>
 </div>
 <span className="ml-2 text-lg font-bold ">Limn Systems</span>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setSidebarOpen(false)}
 className="lg:hidden"
 >
 <X className="w-5 h-5" />
 </Button>
 </div>

 {/* Navigation */}
 <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
 {navigation.map((item) => {
 const Icon = item.icon;
 const isActive = pathname === item.href;

 return (
 <Link
 key={item.name}
 href={item.href}
 onClick={() => setSidebarOpen(false)}
 className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
 isActive
 ? 'bg-[#91bdbd] text-foreground'
 : ' hover:card hover:'
 }`}
 >
 <Icon className="w-5 h-5 mr-3" />
 {item.name}
 </Link>
 );
 })}
 </nav>

 {/* User Profile Section */}
 <div className="border-t border p-4">
 <div className="flex items-center space-x-3 mb-3">
 <div className="w-10 h-10 bg-[#91bdbd] rounded-full flex items-center justify-center">
 <span className="text-foreground text-sm font-medium">
 {userInfo?.email?.[0]?.toUpperCase() || '?'}
 </span>
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-sm font-medium truncate">{userInfo?.email || 'Loading...'}</div>
 <div className="text-xs text-secondary">Client Portal</div>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={handleSignOut}
 disabled={signingOut}
 className="w-full border hover:card"
 >
 {signingOut ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Signing out...
 </>
 ) : (
 <>
 <LogOut className="mr-2 h-4 w-4" />
 Sign Out
 </>
 )}
 </Button>
 </div>
 </div>
 </aside>

 {/* Main Content */}
 <div className="lg:pl-64">
 {/* Top Header */}
 <header className="bg-card border-b border sticky top-0 z-30">
 <div className="flex items-center justify-between h-16 px-4 sm:px-6">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setSidebarOpen(true)}
 className="lg:hidden"
 >
 <Menu className="w-6 h-6" />
 </Button>

 <div className="flex-1" />

 {/* Notifications */}
 <Link href="/portal/notifications" className="relative">
 <Button variant="ghost" size="sm" className="relative">
 <Bell className="w-5 h-5" />
 {unreadCount > 0 && (
 <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive-muted text-foreground text-xs">
 {unreadCount > 9 ? '9+' : unreadCount}
 </Badge>
 )}
 </Button>
 </Link>
 </div>
 </header>

 {/* Page Content */}
 <main className="p-4 sm:p-6 lg:p-8">{children}</main>
 </div>
 </div>
 );
}
