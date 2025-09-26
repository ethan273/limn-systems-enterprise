import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import speakeasy from 'speakeasy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function MFASetup({ userId }: { userId: string }) {
  const [secret, setSecret] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const generateSecret = () => {
    const generated = speakeasy.generateSecret({
      name: `Limn Systems (${userId})`,
      issuer: 'Limn Systems',
    });
    setSecret(generated);
  };

  const verifyAndEnable = async () => {
    if (!secret || !verificationCode) return;
    
    setIsVerifying(true);
    try {
      const verified = speakeasy.totp.verify({
        secret: secret.base32,
        encoding: 'base32',        token: verificationCode,
        window: 2,
      });

      if (!verified) {
        toast.error('Invalid verification code');
        return;
      }

      // Save secret to database
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          secret: secret.base32,
        }),
      });

      if (response.ok) {
        toast.success('MFA enabled successfully');
        // Redirect or update UI
      } else {
        toast.error('Failed to enable MFA');
      }
    } catch (error) {
      console.error('MFA setup error:', error);
      toast.error('Failed to enable MFA');
    } finally {      setIsVerifying(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enable Two-Factor Authentication</CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!secret ? (
          <Button onClick={generateSecret} className="w-full">
            Generate QR Code
          </Button>
        ) : (
          <>
            <div className="flex justify-center p-4 bg-white rounded">
              <QRCodeSVG value={secret.otpauth_url} size={200} />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Or enter this code manually:
              </p>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {secret.base32}
              </code>
            </div>            
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Enter verification code
              </label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
            
            <Button
              onClick={verifyAndEnable}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Enable MFA'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}