'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Users, Building, ShoppingCart } from 'lucide-react'

export default function LoginPage() {
 const router = useRouter()
 const { resolvedTheme } = useTheme()
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
  setMounted(true)
 }, [])

 const handleUserTypeSelection = (userType: 'employee' | 'contractor' | 'customer' | 'dev') => {
 switch (userType) {
 case 'employee':
 router.push('/auth/employee')
 break
 case 'contractor':
 router.push('/auth/contractor')
 break
 case 'customer':
 router.push('/auth/customer')
 break
 case 'dev':
 router.push('/auth/dev')
 break
 }
 }


 return (
 <div className="min-h-screen flex items-center justify-center p-4">
 <div className="w-full max-w-lg">
 <div className="card border shadow-lg rounded-lg px-8 py-10">
 <div className="mb-8 flex justify-center">
 {mounted ? (
 <Image
 src={resolvedTheme === 'dark' ? '/images/Limn_Logo_Light_Mode.png' : '/images/Limn_Logo_Dark_Mode.png'}
 alt="Limn Systems"
 width={180}
 height={50}
 priority
 />
 ) : (
 <div style={{ width: 180, height: 50 }} />
 )}
 </div>

 <div className="space-y-4">
 {/* Employee Login */}
 <button
 onClick={() => handleUserTypeSelection('employee')}
 className="w-full p-6 card border-2 rounded-lg hover:border-primary hover:card transition-all group"
 >
 <div className="flex items-center space-x-4">
 <div className="flex-shrink-0">
 <div className="w-12 h-12 bg-info-muted/20 rounded-lg flex items-center justify-center group-hover:bg-info-muted/30 transition-colors">
 <Building className="w-6 h-6 text-info" />
 </div>
 </div>
 <div className="text-left">
 <h3 className="text-lg font-semibold text-primary">
 Employee Login
 </h3>
 <p className="text-sm page-subtitle">
 Sign in with your @limn.us.com Google account
 </p>
 </div>
 </div>
 </button>

 {/* Contractor Login */}
 <button
 onClick={() => handleUserTypeSelection('contractor')}
 className="w-full p-6 card border-2 rounded-lg hover:border-success hover:card transition-all group"
 >
 <div className="flex items-center space-x-4">
 <div className="flex-shrink-0">
 <div className="w-12 h-12 bg-success-muted/20 rounded-lg flex items-center justify-center group-hover:bg-success-muted/30 transition-colors">
 <Users className="w-6 h-6 text-success" />
 </div>
 </div>
 <div className="text-left">
 <h3 className="text-lg font-semibold text-primary">
 Partner Login
 </h3>
 <p className="text-sm page-subtitle">
 Sign in with your contractor account credentials
 </p>
 </div>
 </div>
 </button>

 {/* Customer Portal */}
 <button
 onClick={() => handleUserTypeSelection('customer')}
 className="w-full p-6 card border-2 rounded-lg hover:border-secondary hover:card transition-all group"
 >
 <div className="flex items-center space-x-4">
 <div className="flex-shrink-0">
 <div className="w-12 h-12 bg-primary-muted/20 rounded-lg flex items-center justify-center group-hover:bg-primary-muted/30 transition-colors">
 <ShoppingCart className="w-6 h-6 text-secondary" />
 </div>
 </div>
 <div className="text-left">
 <h3 className="text-lg font-semibold text-primary">
 Client Portal
 </h3>
 <p className="text-sm page-subtitle">
 Access your project dashboard and orders
 </p>
 </div>
 </div>
 </button>

 {/* Development Login - Only show in development */}
 {process.env.NODE_ENV === 'development' && (
 <button
 onClick={() => handleUserTypeSelection('dev')}
 className="w-full p-6 card border-2 rounded-lg hover:border-warning hover:card transition-all group"
 >
 <div className="flex items-center space-x-4">
 <div className="flex-shrink-0">
 <div className="w-12 h-12 bg-warning-muted/20 rounded-lg flex items-center justify-center group-hover:bg-warning-muted/30 transition-colors">
 <svg className="w-6 h-6 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
 </svg>
 </div>
 </div>
 <div className="text-left">
 <h3 className="text-lg font-semibold text-primary">
 Development Login
 </h3>
 <p className="text-sm page-subtitle">
 Testing & development access (dev mode only)
 </p>
 </div>
 </div>
 </button>
 )}
 </div>

 <div className="mt-8 pt-6 border-t ">
 <p className="text-xs text-tertiary text-center">
 Need help accessing your account?{' '}
 <a
 href="mailto:support@limnsystems.com"
 className="text-info hover:text-info font-medium"
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