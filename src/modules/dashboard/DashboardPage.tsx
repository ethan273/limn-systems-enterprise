'use client'

import React from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { useAuthContext } from '@/lib/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import {
 BarChart,
 Users,
 ShoppingCart,
 Package,
 TrendingUp,
 Calendar,
 UserPlus,
 Building2,
 CheckCircle,
 AlertTriangle
} from 'lucide-react'

export default function DashboardPage() {
 const { isAdmin } = useAuthContext()

 // Fetch admin stats for pending requests - only if user is admin
 const { data: adminStats } = api.auth.getRequestStats.useQuery(undefined, {
 enabled: isAdmin
 })

 // Fetch executive dashboard data for business metrics
 const { data: executiveStats, isLoading, error } = api.dashboards.getExecutive.useQuery({
   dateRange: '30d'
 })

 // Show loading state
 if (isLoading) {
   return (
     <div className="p-6 max-w-7xl mx-auto">
       <div className="mb-8">
         <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
         <p className="text-muted-foreground">Loading dashboard data...</p>
       </div>
       <div className="flex items-center justify-center h-64">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
       </div>
     </div>
   )
 }

 // Show error state
 if (error) {
   return (
     <div className="p-6 max-w-7xl mx-auto">
       <div className="mb-8">
         <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
         <p className="text-muted-foreground">Welcome to Limn Systems Enterprise</p>
       </div>
       <div className="flex flex-col items-center justify-center h-64 gap-4">
         <AlertTriangle className="h-12 w-12 text-destructive" />
         <p className="text-muted-foreground">Failed to load dashboard data. Please try refreshing the page.</p>
         <p className="text-sm text-muted-foreground">{error.message}</p>
       </div>
     </div>
   )
 }

 return (
 <div className="p-6 max-w-7xl mx-auto">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
 <p className="text-muted-foreground">Welcome to Limn Systems Enterprise</p>
 </div>

 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
 {/* Pending Approvals Card - Only show if there are pending requests */}
 {(adminStats?.stats?.pending ?? 0) > 0 && (
 <DashboardStatCard
 title="Pending Approvals"
 value={adminStats?.stats?.pending ?? 0}
 description="Access requests awaiting review"
 icon={UserPlus}
 iconColor="warning"
 />
 )}

 {/* Total Users Card */}
 <DashboardStatCard
 title="Total Users"
 value={adminStats?.stats ? adminStats.stats.approved : 0}
 description="Approved system users"
 icon={Users}
 iconColor="info"
 />

 {/* Approval Rate Card */}
 <DashboardStatCard
 title="Approval Rate"
 value={`${adminStats?.stats?.approvalRate || 0}%`}
 description="Request approval success rate"
 icon={CheckCircle}
 iconColor="success"
 />

 {/* Orders Card */}
 <DashboardStatCard
 title="Total Orders"
 value={executiveStats?.summary?.totalOrders ?? 0}
 description={`${(executiveStats?.summary?.orderGrowth ?? 0) >= 0 ? '↑' : '↓'} ${Math.abs(executiveStats?.summary?.orderGrowth ?? 0).toFixed(1)}% vs previous period`}
 icon={ShoppingCart}
 iconColor="primary"
 />

 {/* Revenue Card */}
 <DashboardStatCard
 title="Total Revenue"
 value={`$${(executiveStats?.summary?.totalRevenue ?? 0).toLocaleString()}`}
 description={`${(executiveStats?.summary?.revenueGrowth ?? 0) >= 0 ? '↑' : '↓'} ${Math.abs(executiveStats?.summary?.revenueGrowth ?? 0).toFixed(1)}% vs previous period`}
 icon={TrendingUp}
 iconColor="success"
 />

 {/* Production Card */}
 <DashboardStatCard
 title="In Production"
 value={executiveStats?.operations?.activeProduction ?? 0}
 description="Items being manufactured"
 icon={Package}
 iconColor="warning"
 />

 {/* Customers Card */}
 <DashboardStatCard
 title="Active Customers"
 value={executiveStats?.summary?.activeCustomers ?? 0}
 description={`${executiveStats?.summary?.newCustomers ?? 0} new this period`}
 icon={Building2}
 iconColor="info"
 />

 {/* Projects Card */}
 <DashboardStatCard
 title="Active Projects"
 value={executiveStats?.operations?.activeProjects ?? 0}
 description="In various stages"
 icon={Calendar}
 iconColor="primary"
 />
 </div>

 {/* Recent Activity Section */}
 {adminStats?.recentRequests && adminStats.recentRequests.length > 0 && (
 <div className="mt-8">
 <Card className="bg-card border-border">
 <CardHeader>
 <CardTitle className="text-foreground">Recent Access Requests</CardTitle>
 <p className="text-muted-foreground text-sm">Latest user access requests</p>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {adminStats.recentRequests.slice(0, 5).map((request: any) => (
 <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-3">
 <Badge
 className={
 request.status === 'pending'
 ? 'bg-warning-muted text-warning border-warning'
 : request.status === 'approved'
 ? 'bg-success-muted text-success border-success'
 : 'bg-destructive-muted text-destructive border-destructive'
 }
 >
 {request.status}
 </Badge>
 <div>
 <p className="text-foreground font-medium">{request.email}</p>
 <p className="text-muted-foreground text-sm">{request.company_name}</p>
 </div>
 </div>
 <div className="text-muted-foreground text-sm">
 {new Date(request.requested_at).toLocaleDateString()}
 </div>
 </div>
 ))}
 </div>
 {adminStats.recentRequests.length > 5 && (
 <div className="mt-4 pt-4 border-t border-border">
 <Link href="/admin/approvals">
 <Button variant="outline" className="w-full ">
 View All Requests
 </Button>
 </Link>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )}

 {/* Quick Actions */}
 <div className="mt-8">
 <Card className="bg-card border-border">
 <CardHeader>
 <CardTitle className="text-foreground">Quick Actions</CardTitle>
 <p className="text-muted-foreground text-sm">Common administrative tasks</p>
 </CardHeader>
 <CardContent>
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 <Link href="/admin/approvals">
 <Button variant="default" className="w-full bg-[hsl(210,100%,50%)] text-white hover:bg-[hsl(210,100%,45%)] transition-all">
 <UserPlus className="w-4 h-4 mr-2" />
 Manage Access
 </Button>
 </Link>
 <Button variant="secondary" className="w-full hover:bg-primary/10 transition-all">
 <ShoppingCart className="w-4 h-4 mr-2" />
 View Orders
 </Button>
 <Button variant="secondary" className="w-full hover:bg-primary/10 transition-all">
 <Package className="w-4 h-4 mr-2" />
 Production
 </Button>
 <Button variant="secondary" className="w-full hover:bg-primary/10 transition-all">
 <BarChart className="w-4 h-4 mr-2" />
 Reports
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}