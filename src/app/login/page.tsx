'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Users, Building, ShoppingCart } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const handleUserTypeSelection = (userType: 'employee' | 'contractor' | 'customer') => {
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
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-gray-800 border border-gray-700 shadow-lg rounded-lg px-8 py-10">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="text-3xl font-bold text-white">LIMN</div>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Welcome to Limn Systems
            </h1>
            <p className="text-gray-400 mt-2">
              Please select your account type to continue
            </p>
          </div>

          <div className="space-y-4">
            {/* Employee Login */}
            <button
              onClick={() => handleUserTypeSelection('employee')}
              className="w-full p-6 bg-gray-800 border-2 border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <Building className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">
                    Employee Login
                  </h3>
                  <p className="text-sm text-gray-400">
                    Sign in with your @limn.us.com Google account
                  </p>
                </div>
              </div>
            </button>

            {/* Contractor Login */}
            <button
              onClick={() => handleUserTypeSelection('contractor')}
              className="w-full p-6 bg-gray-800 border-2 border-gray-600 rounded-lg hover:border-green-500 hover:bg-gray-700 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">
                    Partner Login
                  </h3>
                  <p className="text-sm text-gray-400">
                    Sign in with your contractor account credentials
                  </p>
                </div>
              </div>
            </button>

            {/* Customer Portal */}
            <button
              onClick={() => handleUserTypeSelection('customer')}
              className="w-full p-6 bg-gray-800 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-700 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">
                    Client Portal
                  </h3>
                  <p className="text-sm text-gray-400">
                    Access your project dashboard and orders
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-xs text-gray-500 text-center">
              Need help accessing your account?{' '}
              <a
                href="mailto:support@limnsystems.com"
                className="text-blue-400 hover:text-blue-300 font-medium"
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