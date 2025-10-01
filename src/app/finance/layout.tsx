import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:ml-64">
        <Header />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
