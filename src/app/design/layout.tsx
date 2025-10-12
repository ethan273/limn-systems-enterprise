"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DesignLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const pathname = usePathname();

 // Full-screen mode for board editor (no sidebar/header)
 const isFullScreen = pathname?.includes('/design/boards/') && pathname !== '/design/boards';

 if (isFullScreen) {
   return <>{children}</>;
 }

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
