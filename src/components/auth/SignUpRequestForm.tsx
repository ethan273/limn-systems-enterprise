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
 <div className="min-h-screen flex items-center justify-center card px-4 sm:px-6 lg:px-8">
 <div className="max-w-md w-full space-y-8">
 <div>
 <h2 className="mt-6 text-center text-3xl font-extrabold ">
 Request Access to Limn Systems
 </h2>
 <p className="mt-2 text-center text-sm text-secondary">
 Submit your information for approval. All requests are manually reviewed.
 </p>
 </div>
 <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
 <div className="space-y-4">
 {/* Personal Information */}
 <div className="bg-card p-6 rounded-lg shadow-sm border border">
 <h3 className="text-lg font-medium mb-4 flex items-center">
 <User className="mr-2 h-5 w-5 text-primary" />
 Personal Information
 </h3>
 
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label htmlFor="firstName" className="block text-sm font-medium ">
 First Name *
 </label>
 <input
 {...register('firstName')}
 type="text"
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="John"
 />
 {errors.firstName && (
 <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
 )}
 </div>
 <div>
 <label htmlFor="lastName" className="block text-sm font-medium ">
 Last Name *
 </label>
 <input
 {...register('lastName')}
 type="text"
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="Doe"
 />
 {errors.lastName && (
 <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
 )}
 </div>
 </div>

 {/* Email and Phone */}
 <div>
 <label htmlFor="email" className="block text-sm font-medium">
 Email Address *
 </label>
 <input
 {...register('email')}
 type="email"
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="john.doe@company.com"
 />
 {errors.email && (
 <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
 )}
 </div>

 <div>
 <label htmlFor="phoneNumber" className="block text-sm font-medium">
 Phone Number
 </label>
 <input
 {...register('phoneNumber')}
 type="tel"
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="+1 (555) 123-4567"
 />
 {errors.phoneNumber && (
 <p className="mt-1 text-sm text-destructive">{errors.phoneNumber.message}</p>
 )}
 </div>

 <div>
 <label htmlFor="companyName" className="block text-sm font-medium">
 Company Name *
 </label>
 <input
 {...register('companyName')}
 type="text"
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="Acme Corporation"
 />
 {errors.companyName && (
 <p className="mt-1 text-sm text-destructive">{errors.companyName.message}</p>
 )}
 </div>
 </div>

 {/* Business Justification */}
 <div className="bg-card p-6 rounded-lg shadow-sm border border">
 <h3 className="text-lg font-medium mb-4">
 Business Justification
 </h3>

 <div className="space-y-4">
 <div>
 <label htmlFor="businessJustification" className="block text-sm font-medium">
 Why do you need access to Limn Systems? *
 </label>
 <textarea
 {...register('businessJustification')}
 rows={4}
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="Explain how you plan to use Limn Systems and what business need it will address..."
 />
 {errors.businessJustification && (
 <p className="mt-1 text-sm text-destructive">{errors.businessJustification.message}</p>
 )}
 </div>

 <div>
 <label htmlFor="referralSource" className="block text-sm font-medium">
 How did you hear about us?
 </label>
 <input
 {...register('referralSource')}
 type="text"
 className="mt-1 block w-full rounded-md border shadow-sm focus:border-primary focus:ring-indigo-500 sm:text-sm"
 placeholder="Google Search, Referral, etc."
 />
 </div>
 </div>
 </div>

 {/* Terms and Conditions */}
 <div className="flex items-start">
 <input
 {...register('agreeToTerms')}
 type="checkbox"
 className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
 />
 <label htmlFor="agreeToTerms" className="ml-2 block text-sm">
 I agree to the{' '}
 <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
 Terms of Service
 </a>{' '}
 and{' '}
 <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
 Privacy Policy
 </a>
 *
 </label>
 </div>
 {errors.agreeToTerms && (
 <p className="mt-1 text-sm text-destructive">{errors.agreeToTerms.message}</p>
 )}
 </div>

 {/* Submit Button */}
 <div>
 <button
 type="submit"
 disabled={_isSubmitting}
 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {_isSubmitting ? 'Submitting...' : 'Submit Access Request'}
 </button>
 </div>

 {/* Status Messages */}
 {_submitStatus === 'success' && (
 <div className="rounded-md bg-green-50 p-4">
 <p className="text-sm font-medium text-green-800">
 Your request has been submitted successfully! Redirecting...
 </p>
 </div>
 )}

 {_submitStatus === 'error' && (
 <div className="rounded-md bg-red-50 p-4">
 <p className="text-sm font-medium text-red-800">
 {_errorMessage || 'An error occurred. Please try again.'}
 </p>
 </div>
 )}

 {/* Sign In Link */}
 <div className="text-center">
 <p className="text-sm">
 Already have access?{' '}
 <a href="/auth/sign-in" className="text-primary hover:underline font-medium">
 Sign in here
 </a>
 </p>
 </div>
 </form>
 </div>
 </div>
 );
}
