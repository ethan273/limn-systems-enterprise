/**
 * Email Unsubscribe Page
 *
 * Public page for users to unsubscribe from email campaigns
 *
 * @module unsubscribe/[token]
 * @created 2025-10-26
 * @phase Grand Plan Phase 5 - Critical Fix
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const unsubscribeMutation = api.emailCampaigns.unsubscribe.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setIsProcessing(false);
    },
    onError: (err) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  const handleUnsubscribe = async () => {
    setIsProcessing(true);
    setError(null);
    unsubscribeMutation.mutate({ token });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Successfully Unsubscribed</CardTitle>
            </div>
            <CardDescription>
              You have been removed from our mailing list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You will no longer receive emails from our campaigns. We're sorry to see you go!
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe from Emails</CardTitle>
          <CardDescription>
            Are you sure you want to unsubscribe from our email campaigns?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            By clicking "Unsubscribe", you will no longer receive marketing
            emails from us. You will still receive important transactional
            emails related to your account.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleUnsubscribe}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unsubscribe
            </Button>
            <Button
              onClick={() => router.push('/')}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
