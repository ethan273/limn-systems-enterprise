import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-wrapper">
        <Header />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
