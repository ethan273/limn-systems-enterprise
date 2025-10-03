'use client'

import React from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { useAuthContext } from '@/lib/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
 BarChart,
 Users,
 ShoppingCart,
 Package,
 TrendingUp,
 Calendar,
 UserPlus,
 Clock,
 Building2,
 CheckCircle
} from 'lucide-react'

export default function DashboardPage() {
 const { isAdmin } = useAuthContext()

 // Fetch admin stats for pending requests - only if user is admin
 const { data: adminStats } = api.auth.getRequestStats.useQuery(undefined, {
 enabled: isAdmin
 })

 return (
 <div className="p-6 max-w-7xl mx-auto">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
 <p className="text-muted-foreground">Welcome to Limn Systems Enterprise</p>
 </div>

 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
 {/* Pending Approvals Card - Only show if there are pending requests */}
 {(adminStats?.stats?.pending ?? 0) > 0 && (
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Pending Approvals
 </CardTitle>
 <UserPlus className="h-4 w-4 text-orange-500" />
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-between">
 <div className="text-2xl font-bold text-orange-400">
 {adminStats?.stats?.pending ?? 0}
 </div>
 <Badge className="bg-orange-500/20 text-orange-400">
 Urgent
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground mb-3">
 Access requests awaiting review
 </p>
 <Link href="/admin/approvals">
 <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
 <Clock className="w-4 h-4 mr-2" />
 Review Requests
 </Button>
 </Link>
 </CardContent>
 </Card>
 )}

 {/* Total Users Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Total Users
 </CardTitle>
 <Users className="h-4 w-4 text-blue-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">
 {adminStats?.stats ? adminStats.stats.approved : 0}
 </div>
 <p className="text-xs text-muted-foreground">
 Approved system users
 </p>
 </CardContent>
 </Card>

 {/* Approval Rate Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Approval Rate
 </CardTitle>
 <CheckCircle className="h-4 w-4 text-green-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">
 {adminStats?.stats?.approvalRate || 0}%
 </div>
 <p className="text-xs text-muted-foreground">
 Request approval success rate
 </p>
 </CardContent>
 </Card>

 {/* Orders Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Active Orders
 </CardTitle>
 <ShoppingCart className="h-4 w-4 text-purple-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">24</div>
 <p className="text-xs text-muted-foreground">
 In production and shipping
 </p>
 </CardContent>
 </Card>

 {/* Revenue Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Monthly Revenue
 </CardTitle>
 <TrendingUp className="h-4 w-4 text-green-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">$45,231</div>
 <p className="text-xs text-muted-foreground">
 +12% from last month
 </p>
 </CardContent>
 </Card>

 {/* Production Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 In Production
 </CardTitle>
 <Package className="h-4 w-4 text-yellow-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">18</div>
 <p className="text-xs text-muted-foreground">
 Items being manufactured
 </p>
 </CardContent>
 </Card>

 {/* Customers Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Active Customers
 </CardTitle>
 <Building2 className="h-4 w-4 text-cyan-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">89</div>
 <p className="text-xs text-muted-foreground">
 With active projects
 </p>
 </CardContent>
 </Card>

 {/* Projects Card */}
 <Card className="bg-card border-border">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 Active Projects
 </CardTitle>
 <Calendar className="h-4 w-4 text-indigo-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">32</div>
 <p className="text-xs text-muted-foreground">
 In various stages
 </p>
 </CardContent>
 </Card>
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
 ? 'bg-yellow-500/20 text-yellow-400'
 : request.status === 'approved'
 ? 'bg-green-500/20 text-green-400'
 : 'bg-red-500/20 text-red-400'
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
 <Button variant="outline" className="w-full border-gray-600 text-muted-foreground hover:bg-muted">
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
 <Button className="w-full bg-blue-600 hover:bg-blue-700">
 <UserPlus className="w-4 h-4 mr-2" />
 Manage Access
 </Button>
 </Link>
 <Button className="w-full bg-muted hover:bg-gray-600">
 <ShoppingCart className="w-4 h-4 mr-2" />
 View Orders
 </Button>
 <Button className="w-full bg-muted hover:bg-gray-600">
 <Package className="w-4 h-4 mr-2" />
 Production
 </Button>
 <Button className="w-full bg-muted hover:bg-gray-600">
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