import AdminApprovalDashboard from "@/components/admin/ApprovalDashboard";

export default function ApprovalsPage() {
 return (
 <div className="container mx-auto py-6">
 <div className="mb-6">
 <h1 className="text-3xl font-bold tracking-tight">User Approvals</h1>
 <p className="text-muted-foreground">
 Review and approve pending user registrations
 </p>
 </div>

 <AdminApprovalDashboard />
 </div>
 );
}
