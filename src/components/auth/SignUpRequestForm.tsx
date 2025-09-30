// Sign-Up Request Form Component
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { User } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  phoneNumber: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  businessJustification: z.string().min(20, 'Please provide at least 20 characters explaining your business need'),
  referralSource: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms')
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpRequestForm() {
  const router = useRouter();
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [_submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [_errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sign-up request failed');
      }
      setSubmitStatus('success');
      reset();
      
      // Redirect to verification page after 2 seconds
      setTimeout(() => {
        router.push('/auth/verify-email-sent');
      }, 2000);
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Request Access to Limn Systems
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Submit your information for approval. All requests are manually reviewed.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-indigo-500" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
