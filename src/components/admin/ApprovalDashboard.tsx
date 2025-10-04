// Admin Approval Dashboard Component
'use client';

import { useState, useEffect } from 'react';
import { format as _format } from 'date-fns';
import { 
 Check as _Check,
 X as _X,
 Eye as _Eye,
 Clock as _Clock,
 AlertCircle as _AlertCircle,
 Filter as _Filter,
 Search as _Search,
 ChevronDown as _ChevronDown,
 UserCheck as _UserCheck,
 UserX as _UserX,
 Building as _Building,
 Mail as _Mail,
 Phone as _Phone,
 Calendar as _Calendar,
 MessageSquare as _MessageSquare,
 Loader2,
 RefreshCw as _RefreshCw
} from 'lucide-react';

interface PendingSignUp {
 id: string;
 email: string;
 firstName?: string;
 lastName?: string; companyName?: string;
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
 const [_selectedSignUp, _setSelectedSignUp] = useState<PendingSignUp | null>(null);
 const [_searchTerm, _setSearchTerm] = useState('');
 const [_filterStatus, _setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');
 const [_refreshing, _setRefreshing] = useState(false);

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
 } catch (error) { console.error('Error fetching sign-ups:', error);
 } finally {
 setLoading(false);
 }
 };

 // Placeholder for rest of dashboard UI
 return (
 <div className="px-4 sm:px-6 lg:px-8 py-8">
 <div className="sm:flex sm:items-center">
 <div className="sm:flex-auto">
 <h1 className="text-2xl font-semibold ">Sign-Up Requests</h1>
 <p className="mt-2 text-sm ">
 Review and approve or reject pending sign-up requests.
 </p>
 </div>
 </div>
 {/* Dashboard content will be rendered here */}
 {loading ? (
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 ) : (
 <div>Total pending: {signUps.length}</div>
 )}
 </div>
 );
}