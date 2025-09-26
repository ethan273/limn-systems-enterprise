'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ContractorLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 border border-gray-700 shadow-lg rounded-lg px-8 py-10">
          <div className="mb-8">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login options
            </Link>

            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="text-3xl font-bold text-white">LIMN</div>
              </div>
              <h1 className="text-3xl font-bold text-white">
                Partner Login
              </h1>
              <p className="text-gray-400 mt-2">
                Coming Soon
              </p>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-300">
                  Partner Portal In Development
                </h3>
                <div className="mt-2 text-sm text-green-400">
                  <p>
                    The partner portal is currently under development.
                    If you&apos;re a contractor or partner, please contact support for access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-xs text-gray-500 text-center">
              Questions about partner access?{' '}
              <a
                href="mailto:partners@limnsystems.com"
                className="text-green-400 hover:text-green-300 font-medium"
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