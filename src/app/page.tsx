import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Home() {
 return (
 <main className="flex min-h-screen flex-col items-center justify-center p-24">
 <div className="text-center">
 <div className="mb-6 flex justify-center">
 <Building2 className="w-20 h-20 text-primary" />
 </div>
 <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
 Limn Systems
 </h1>
 <p className="text-xl text-secondary mb-8">
 Enterprise Management Platform
 </p>
 <Link
 href="/dashboard"
 className="inline-block btn-primary hover:btn-primary text-foreground px-8 py-3 rounded-lg font-medium transition-colors"
 >
 Go to Dashboard
 </Link>
 </div>
 </main>
 );
}