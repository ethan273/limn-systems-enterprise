'use client'

import { ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/common'

export default function CustomerLoginPage() {
 return (
 <div className="min-h-screen flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <div className="card border shadow-lg rounded-lg px-8 py-10">
 <div className="mb-8">
 <Link
 href="/login"
 className="inline-flex items-center text-sm text-secondary hover:text-primary mb-6"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to login options
 </Link>

 <div className="text-center">
 <div className="mb-6 flex justify-center">
 <div className="text-3xl font-bold text-primary">LIMN</div>
 </div>
 <h1 className="text-3xl font-bold text-primary">
 Client Portal
 </h1>
 <p className="text-secondary mt-2">
 Coming Soon
 </p>
 </div>
 </div>

 <EmptyState
 icon={ShoppingCart}
 title="Client Portal In Development"
 description="The client portal is currently under development. This is where customers will access their project dashboard and orders. Magic link authentication will be available for clients once launched."
 variant="coming-soon"
 />

 <div className="mt-8 pt-6 border-t ">
 <p className="text-xs text-tertiary text-center">
 Questions about your project?{' '}
 <a
 href="mailto:support@limnsystems.com"
 className="text-secondary hover:text-secondary font-medium"
 >
 Contact Support
 </a>
 </p>
 </div>
 </div>
 </div>
 </div>
 )
}
