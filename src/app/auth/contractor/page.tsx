'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/common'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export default function ContractorLoginPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
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
 {mounted ? (
 <Image
 src={resolvedTheme === 'dark' ? '/images/Limn_Logo_Light_Mode.png' : '/images/Limn_Logo_Dark_Mode.png'}
 alt="Limn Systems"
 width={180}
 height={50}
 priority
 key={resolvedTheme}
 unoptimized
 />
 ) : (
 <div style={{ width: 180, height: 50 }} />
 )}
 </div>
 <h1 className="text-3xl font-bold text-primary">
 Partner Login
 </h1>
 <p className="text-secondary mt-2">
 Coming Soon
 </p>
 </div>
 </div>

 <EmptyState
 icon={Users}
 title="Partner Portal In Development"
 description="The partner portal is currently under development. If you're a contractor or partner, please contact support for access."
 variant="coming-soon"
 />

 <div className="mt-8 pt-6 border-t ">
 <p className="text-xs text-tertiary text-center">
 Questions about partner access?{' '}
 <a
 href="mailto:partners@limnsystems.com"
 className="text-success hover:text-success font-medium"
 >
 Contact Partner Support
 </a>
 </p>
 </div>
 </div>
 </div>
 </div>
 )
}
