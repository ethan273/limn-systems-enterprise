// MFA Setup Component
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  Download,
  X
} from 'lucide-react';

interface BackupCode {
  code: string;
  used: boolean;
}

export default function MFASetup() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'backup' | 'complete'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [downloadedCodes, setDownloadedCodes] = useState(false);

  // Enable MFA and get QR code
  const enableMFA = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setStep('qr');
      } else {
        setError(data.error || 'Failed to enable MFA');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }    finally {
      setIsLoading(false);
    }
  };

  // Placeholder for rest of MFA setup UI
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Two-Factor Authentication Setup
      </h1>
      {/* MFA setup steps will be rendered here */}
      <button onClick={enableMFA} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Enable MFA'}
      </button>
    </div>
  );
}