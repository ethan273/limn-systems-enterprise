'use client';

import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Building2, Phone, User, Send, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

type ViewState = 'login' | 'request-access' | 'pending-approval' | 'link-sent';

export default function CustomerLoginPage() {
  const { resolvedTheme } = useTheme();
  const [viewState, setViewState] = useState<ViewState>('login');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
    reason_for_access: '',
  });

  // Send magic link
  const sendMagicLinkMutation = api.auth.sendMagicLink.useMutation({
    onSuccess: () => {
      setViewState('link-sent');
      toast.success('Magic link sent! Check your email to sign in.');
    },
    onError: (error) => {
      // If not approved, show request access form
      if (error.message.includes('not been approved') || error.message.includes('FORBIDDEN')) {
        setViewState('request-access');
        toast.info('Please request access to continue');
      } else {
        toast.error(error.message || 'Failed to send magic link');
      }
    },
  });

  // Request access
  const requestAccessMutation = api.auth.requestAccess.useMutation({
    onSuccess: () => {
      setViewState('pending-approval');
      toast.success('Access request submitted! You&apos;ll receive an email when approved.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit access request');
    },
  });

  const handleSendMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    sendMagicLinkMutation.mutate({ email });
  };

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !formData.first_name) {
      toast.error('Email and first name are required');
      return;
    }

    requestAccessMutation.mutate({
      email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      company: formData.company,
      phone: formData.phone,
      user_type: 'customer',
      reason_for_access: formData.reason_for_access,
    });
  };

  const handleBackToLogin = () => {
    setViewState('login');
    setFormData({
      first_name: '',
      last_name: '',
      company: '',
      phone: '',
      reason_for_access: '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src={resolvedTheme === 'dark' ? '/images/Limn_Logo_Dark_Mode.png' : '/images/Limn_Logo_Light_Mode.png'}
            alt="Limn Systems"
            width={180}
            height={60}
            className="h-12 w-auto"
            priority
            unoptimized
          />
        </div>

        {/* Back to Main Login */}
        <div className="mb-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        {/* Login View */}
        {viewState === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Client Portal</CardTitle>
              <CardDescription>
                Sign in to access your projects and orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={sendMagicLinkMutation.isPending}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send you a magic link to sign in
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendMagicLinkMutation.isPending}
                >
                  {sendMagicLinkMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    Don&apos;t have access yet?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setViewState('request-access')}
                  >
                    Request Access
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Request Access View */}
        {viewState === 'request-access' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Request Access</CardTitle>
              <CardDescription>
                Fill out this form to request client portal access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="req-email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="req-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={requestAccessMutation.isPending}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="pl-10"
                        required
                        disabled={requestAccessMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={requestAccessMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="pl-10"
                      disabled={requestAccessMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                      disabled={requestAccessMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Access (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason_for_access}
                    onChange={(e) => setFormData({ ...formData, reason_for_access: e.target.value })}
                    placeholder="Tell us why you need access..."
                    rows={3}
                    disabled={requestAccessMutation.isPending}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    disabled={requestAccessMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={requestAccessMutation.isPending}
                    className="flex-1"
                  >
                    {requestAccessMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pending Approval View */}
        {viewState === 'pending-approval' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-warning/10 dark:bg-warning/20 p-3">
                  <AlertCircle className="h-12 w-12 text-warning dark:text-warning" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Request Submitted</CardTitle>
              <CardDescription className="text-center">
                Your access request is pending admin approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-center">
                  We&apos;ve received your request for client portal access. Our team will review your
                  application and you&apos;ll receive an email notification once a decision has been made.
                </p>
              </div>

              <div className="pt-4">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Submitted for: <strong>{email}</strong>
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Magic Link Sent View */}
        {viewState === 'link-sent' && (
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-success/10 dark:bg-success/20 p-3">
                  <CheckCircle2 className="h-12 w-12 text-success dark:text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
              <CardDescription className="text-center">
                We&apos;ve sent you a magic link to sign in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm text-center">
                  Click the link in the email we sent to <strong>{email}</strong> to sign in.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  The link will expire in 1 hour.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
