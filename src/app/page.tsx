import Link from "next/link";

export default function Home() {
 return (
 <main className="flex min-h-screen flex-col items-center justify-center p-24">
 <div className="text-center">
 <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
 Limn Systems
 </h1>
 <p className="text-xl text-secondary mb-8">
 Enterprise Management Platform
 </p>
 <Link
 href="/dashboard"
 className="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-8 py-3 rounded-lg font-medium transition-colors"
 >
 Go to Dashboard
 </Link>
 </div>
 </main>
 );
}