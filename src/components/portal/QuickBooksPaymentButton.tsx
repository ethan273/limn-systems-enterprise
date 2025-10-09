'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickBooksPaymentButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  amountDue: number;
  onPaymentSuccess?: () => void;
  className?: string;
}

export function QuickBooksPaymentButton({
  invoiceId,
  invoiceNumber,
  amountDue,
  onPaymentSuccess,
  className,
}: QuickBooksPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(amountDue.toString());
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'ach'>('credit_card');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const initiatePayment = api.portal.initiateQuickBooksPayment.useMutation({
    onSuccess: () => {
      setPaymentStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setPaymentStatus('idle');
        onPaymentSuccess?.();
      }, 2000);
    },
    onError: (error) => {
      setPaymentStatus('error');
      console.error('Payment initiation failed:', error.message);
    },
  });

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0 || amount > amountDue) {
      setPaymentStatus('error');
      return;
    }

    initiatePayment.mutate({
      invoiceId,
      amount,
      paymentMethod,
    });
  };

  const handleClose = () => {
    if (!initiatePayment.isPending) {
      setIsOpen(false);
      setPaymentStatus('idle');
      setPaymentAmount(amountDue.toString());
    }
  };

  // If no amount due, don't show button
  if (amountDue <= 0) {
    return (
      <Badge variant="outline" className="bg-success-muted text-success border-success">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn("btn-primary", className)}
        size="sm"
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Pay Invoice
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pay Invoice {invoiceNumber}</DialogTitle>
            <DialogDescription>
              Complete your payment securely through QuickBooks Online
            </DialogDescription>
          </DialogHeader>

          {paymentStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-success" />
              <h3 className="text-lg font-semibold">Payment Initiated!</h3>
              <p className="text-sm text-muted-foreground text-center">
                Your payment has been submitted for processing. You will receive a confirmation email shortly.
              </p>
            </div>
          ) : paymentStatus === 'error' && !initiatePayment.isPending ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive" />
              <h3 className="text-lg font-semibold">Payment Failed</h3>
              <p className="text-sm text-muted-foreground text-center">
                {initiatePayment.error?.message || 'Unable to process payment. Please try again or contact support.'}
              </p>
              <Button onClick={() => setPaymentStatus('idle')} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={amountDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10"
                    disabled={initiatePayment.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount due: ${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: 'credit_card' | 'bank_transfer' | 'ach') => setPaymentMethod(value)}
                  disabled={initiatePayment.isPending}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Credit Card
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="ach">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        ACH Payment
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Invoice Number:</span>
                  <span className="font-medium">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Amount:</span>
                  <span className="font-semibold text-primary">
                    ${parseFloat(paymentAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Your payment will be processed securely through QuickBooks Online.
                You will receive a confirmation email once the payment is complete.
              </p>
            </div>
          )}

          {paymentStatus !== 'success' && paymentStatus !== 'error' && (
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={initiatePayment.isPending}>
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={initiatePayment.isPending || parseFloat(paymentAmount) > amountDue}
                className="btn-primary"
              >
                {initiatePayment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay ${parseFloat(paymentAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
