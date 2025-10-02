"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { TRPCProvider } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/ui/command-palette";

interface AppContextType {
 sidebarOpen: boolean;
 setSidebarOpen: (_open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: ReactNode }) {
 const [sidebarOpen, setSidebarOpen] = useState(true);

 return (
 <ThemeProvider>
 <TRPCProvider>
 <AuthProvider>
 <AppContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
 {children}
 <Toaster richColors position="top-right" />
 <CommandPalette />
 </AppContext.Provider>
 </AuthProvider>
 </TRPCProvider>
 </ThemeProvider>
 );
}

export function useAppContext() {
 const context = useContext(AppContext);
 if (!context) {
 throw new Error("useAppContext must be used within Providers");
 }
 return context;
}
