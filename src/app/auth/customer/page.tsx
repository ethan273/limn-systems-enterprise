'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

 <div className="bg-purple-900/20 border border-purple-600 rounded-lg p-4">
 <div className="flex">
 <div className="flex-shrink-0">
 <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
 </svg>
 </div>
 <div className="ml-3">
 <h3 className="text-sm font-medium text-purple-300">
 Client Portal In Development
 </h3>
 <div className="mt-2 text-sm text-purple-400">
 <p>
 The client portal is currently under development.
 This is where customers will access their project dashboard and orders.
 Magic link authentication will be available for clients once launched.
 </p>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-8 pt-6 border-t ">
 <p className="text-xs text-tertiary text-center">
 Questions about your project?{' '}
 <a
 href="mailto:support@limnsystems.com"
 className="text-purple-400 hover:text-purple-300 font-medium"
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