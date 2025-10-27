import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ServiceWorkerUpdater from "@/components/ServiceWorkerUpdater";

// Force dynamic rendering - no static generation or caching for admin pages
// Admin pages must always show real-time data from the database
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceWorkerUpdater />
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-wrapper">
          <Header />
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
