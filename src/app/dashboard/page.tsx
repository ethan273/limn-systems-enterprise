import DashboardPage from "@/modules/dashboard/DashboardPage";

// Force dynamic rendering to ensure middleware authentication runs
export const dynamic = 'force-dynamic';

export default function Dashboard() {
 return <DashboardPage />;
}
