// Admin Approval Dashboard Component
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Check, 
  X, 
  Eye, 
  Clock, 
  AlertCircle, 
  Filter, 
  Search,
  ChevronDown,
  UserCheck,
  UserX,
  Building,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface PendingSignUp {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;  companyName?: string;
  phoneNumber?: string;
  businessJustification?: string;
  referralSource?: string;
  emailVerified: boolean;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function AdminApprovalDashboard() {
  const [signUps, setSignUps] = useState<PendingSignUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignUp, setSelectedSignUp] = useState<PendingSignUp | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingSignUps();
  }, []);

  const fetchPendingSignUps = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sign-ups');
      if (!response.ok) throw new Error('Failed to fetch sign-ups');
      const data = await response.json();
      setSignUps(data.signUps);
    } catch (error) {      console.error('Error fetching sign-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for rest of dashboard UI
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Sign-Up Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and approve or reject pending sign-up requests.
          </p>
        </div>
      </div>
      {/* Dashboard content will be rendered here */}
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      ) : (
        <div>Total pending: {signUps.length}</div>
      )}
    </div>
  );
}