'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { Customer } from '@/lib/db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Download,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';

type CustomerStatus = 'active' | 'inactive' | 'pending' | 'suspended';
type CustomerType = 'individual' | 'business' | 'enterprise';

interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  type: CustomerType;
  status: CustomerStatus;
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  website?: string;
  industry?: string;
  notes?: string;
  tags: string[];
  portal_access: boolean;
  portal_username?: string;
  communication_preferences: {
    email: boolean;
    phone: boolean;
    sms: boolean;
    postal: boolean;
  };
}

const defaultCustomerData: CreateCustomerData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  type: 'business',
  status: 'active',
  tags: [],
  portal_access: false,
  communication_preferences: {
    email: true,
    phone: true,
    sms: false,
    postal: false,
  },
};

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'last_activity' | 'value'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customerData, setCustomerData] = useState<CreateCustomerData>(defaultCustomerData);

  // Query customers
  const { data: customersData, isLoading, refetch } = api.crm.customers.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  // Memoize customers to prevent dependencies from changing on every render
  const customers = useMemo(() => customersData?.items || [], [customersData?.items]);

  // Mutations
  const createCustomer = api.crm.customers.create.useMutation({
    onSuccess: () => {
      toast.success('Client created successfully');
      setShowCreateDialog(false);
      setCustomerData(defaultCustomerData);
      refetch();
    },
    onError: (error) => {
      toast.error('Error creating client: ' + error.message);
    },
  });

  const updateCustomer = api.crm.customers.update.useMutation({
    onSuccess: () => {
      toast.success('Client updated successfully');
      setShowEditDialog(false);
      setEditingCustomer(null);
      refetch();
    },
    onError: (error) => {
      toast.error('Error updating client: ' + error.message);
    },
  });

  const deleteCustomer = api.crm.customers.delete.useMutation({
    onSuccess: () => {
      toast.success('Client deleted successfully');
      setShowDeleteDialog(false);
      setDeletingCustomer(null);
      refetch();
    },
    onError: (error) => {
      toast.error('Error deleting client: ' + error.message);
    },
  });

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      const matchesType = typeFilter === 'all' || customer.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'last_activity':
          aValue = new Date(a.last_activity_date || 0);
          bValue = new Date(b.last_activity_date || 0);
          break;
        case 'value':
          aValue = a.lifetime_value || 0;
          bValue = b.lifetime_value || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Customer stats
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const totalValue = customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;
    const withPortalAccess = customers.filter(c => c.portal_access).length;

    return { total, active, totalValue, averageValue, withPortalAccess };
  }, [customers]);

  const handleCreateCustomer = () => {
    createCustomer.mutate(customerData);
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer) return;
    updateCustomer.mutate({
      id: editingCustomer.id,
      ...customerData,
    });
  };

  const handleDeleteCustomer = () => {
    if (!deletingCustomer) return;
    deleteCustomer.mutate({ id: deletingCustomer.id });
  };

  const handleBulkStatusUpdate = (newStatus: CustomerStatus) => {
    // Implementation for bulk status updates
    toast.success(`Updated ${selectedCustomers.length} clients to ${newStatus}`);
    setSelectedCustomers([]);
    setShowBulkDialog(false);
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(filteredAndSortedCustomers.map(customer => customer.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      billing_address: customer.billing_address || '',
      billing_city: '',
      billing_state: '',
      billing_postal_code: '',
      billing_country: '',
      type: customer.type as CustomerType,
      status: customer.status as CustomerStatus,
      credit_limit: undefined,
      payment_terms: '',
      tax_id: '',
      website: '',
      industry: '',
      notes: customer.notes || '',
      tags: customer.tags || [],
      portal_access: false,
      portal_username: '',
      communication_preferences: {
        email: true,
        phone: true,
        sms: false,
        postal: false,
      },
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'inactive': return 'bg-gray-500/10 text-secondary border-gray-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-secondary border-gray-500/20';
    }
  };

  const getTypeColor = (type: CustomerType) => {
    switch (type) {
      case 'individual': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'business': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'enterprise': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-gray-500/10 text-secondary border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="page-subtitle">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your customer relationships and accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>Add a new client to your CRM system</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={customerData.company}
                        onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_type">Client Type</Label>
                      <Select
                        value={customerData.type}
                        onValueChange={(value: CustomerType) => setCustomerData({ ...customerData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={customerData.status}
                        onValueChange={(value: CustomerStatus) => setCustomerData({ ...customerData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={customerData.industry}
                        onChange={(e) => setCustomerData({ ...customerData, industry: e.target.value })}
                        placeholder="e.g., Technology, Manufacturing"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={customerData.website}
                        onChange={(e) => setCustomerData({ ...customerData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={customerData.notes}
                      onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                      placeholder="Additional notes about this client..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={customerData.address}
                      onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={customerData.city}
                        onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={customerData.state}
                        onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={customerData.postal_code}
                        onChange={(e) => setCustomerData({ ...customerData, postal_code: e.target.value })}
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={customerData.country}
                      onChange={(e) => setCustomerData({ ...customerData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="billing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="credit_limit">Credit Limit</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        value={customerData.credit_limit || ''}
                        onChange={(e) => setCustomerData({ ...customerData, credit_limit: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Input
                        id="payment_terms"
                        value={customerData.payment_terms}
                        onChange={(e) => setCustomerData({ ...customerData, payment_terms: e.target.value })}
                        placeholder="Net 30"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={customerData.tax_id}
                      onChange={(e) => setCustomerData({ ...customerData, tax_id: e.target.value })}
                      placeholder="Tax identification number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_address">Billing Address</Label>
                    <Input
                      id="billing_address"
                      value={customerData.billing_address}
                      onChange={(e) => setCustomerData({ ...customerData, billing_address: e.target.value })}
                      placeholder="Billing street address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="billing_city">Billing City</Label>
                      <Input
                        id="billing_city"
                        value={customerData.billing_city}
                        onChange={(e) => setCustomerData({ ...customerData, billing_city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_state">Billing State</Label>
                      <Input
                        id="billing_state"
                        value={customerData.billing_state}
                        onChange={(e) => setCustomerData({ ...customerData, billing_state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_postal_code">Billing ZIP</Label>
                      <Input
                        id="billing_postal_code"
                        value={customerData.billing_postal_code}
                        onChange={(e) => setCustomerData({ ...customerData, billing_postal_code: e.target.value })}
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="preferences" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="portal_access"
                        checked={customerData.portal_access}
                        onCheckedChange={(checked) => setCustomerData({ ...customerData, portal_access: !!checked })}
                      />
                      <Label htmlFor="portal_access">Grant Portal Access</Label>
                    </div>
                    {customerData.portal_access && (
                      <div>
                        <Label htmlFor="portal_username">Portal Username</Label>
                        <Input
                          id="portal_username"
                          value={customerData.portal_username}
                          onChange={(e) => setCustomerData({ ...customerData, portal_username: e.target.value })}
                          placeholder="portal.username"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-medium">Communication Preferences</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="comm_email"
                          checked={customerData.communication_preferences.email}
                          onCheckedChange={(checked) => setCustomerData({
                            ...customerData,
                            communication_preferences: {
                              ...customerData.communication_preferences,
                              email: !!checked
                            }
                          })}
                        />
                        <Label htmlFor="comm_email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="comm_phone"
                          checked={customerData.communication_preferences.phone}
                          onCheckedChange={(checked) => setCustomerData({
                            ...customerData,
                            communication_preferences: {
                              ...customerData.communication_preferences,
                              phone: !!checked
                            }
                          })}
                        />
                        <Label htmlFor="comm_phone">Phone</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="comm_sms"
                          checked={customerData.communication_preferences.sms}
                          onCheckedChange={(checked) => setCustomerData({
                            ...customerData,
                            communication_preferences: {
                              ...customerData.communication_preferences,
                              sms: !!checked
                            }
                          })}
                        />
                        <Label htmlFor="comm_sms">SMS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="comm_postal"
                          checked={customerData.communication_preferences.postal}
                          onCheckedChange={(checked) => setCustomerData({
                            ...customerData,
                            communication_preferences: {
                              ...customerData.communication_preferences,
                              postal: !!checked
                            }
                          })}
                        />
                        <Label htmlFor="comm_postal">Postal Mail</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} disabled={!customerData.name}>
                  Create Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm page-subtitle">Total Clients</p>
              <p className="page-title">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm page-subtitle">Active</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm page-subtitle">Total Value</p>
              <p className="text-2xl font-bold text-yellow-400">${stats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm page-subtitle">Avg Value</p>
              <p className="text-2xl font-bold text-purple-400">${stats.averageValue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm page-subtitle">Portal Access</p>
              <p className="text-2xl font-bold text-orange-400">{stats.withPortalAccess}</p>
            </div>
            <ExternalLink className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card/50 rounded-lg border p-4 filters-section">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: CustomerStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value: CustomerType | 'all') => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'name' | 'created_at' | 'last_activity' | 'value') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="last_activity">Last Activity</SelectItem>
                <SelectItem value="value">Value</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
          {selectedCustomers.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(true)}>
              Bulk Actions ({selectedCustomers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-card/50 rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Clients ({filteredAndSortedCustomers.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedCustomers.length === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm page-subtitle">Select All</span>
            </div>
          </div>
        </div>

        {filteredAndSortedCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No clients found</h3>
            <p className="text-secondary mb-4">Get started by adding your first client.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Client
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible value={expandedCustomer || ''} onValueChange={setExpandedCustomer}>
            {filteredAndSortedCustomers.map((customer) => (
              <AccordionItem key={customer.id} value={customer.id} className="border-primary">
                <div className="flex items-center space-x-4 p-4">
                  <Checkbox
                    checked={selectedCustomers.includes(customer.id)}
                    onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-left">
                          <div className="font-medium text-white">{customer.name}</div>
                          <div className="text-sm page-subtitle">
                            {customer.company && (
                              <span className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {customer.company}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(customer.status as CustomerStatus)}>
                          {customer.status}
                        </Badge>
                        {customer.type && (
                          <Badge className={getTypeColor(customer.type as CustomerType)}>
                            {customer.type}
                          </Badge>
                        )}
                        {customer.lifetime_value && (
                          <Badge variant="outline" className="text-green-400 border-green-500/20">
                            ${customer.lifetime_value.toLocaleString()}
                          </Badge>
                        )}
                        {customer.portal_access && (
                          <Badge variant="outline" className="text-blue-400 border-blue-500/20">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Portal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setDeletingCustomer(customer);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="portal">Portal</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm page-subtitle">Industry</Label>
                            <p className="text-white">{customer.industry || 'Not specified'}</p>
                          </div>
                          <div>
                            <Label className="text-sm page-subtitle">Website</Label>
                            <p className="text-white">
                              {customer.website ? (
                                <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                  {customer.website}
                                </a>
                              ) : (
                                'Not specified'
                              )}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm page-subtitle">Notes</Label>
                          <p className="text-white">{customer.notes || 'No notes'}</p>
                        </div>
                        <div>
                          <Label className="text-sm page-subtitle">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {customer.tags && customer.tags.length > 0 ? (
                              customer.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <p className="page-subtitle">No tags</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="contact" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm page-subtitle">Email</Label>
                            <p className="text-white flex items-center">
                              {customer.email ? (
                                <>
                                  <Mail className="w-4 h-4 mr-2 text-secondary" />
                                  <a href={`mailto:${customer.email}`} className="text-blue-400 hover:underline">
                                    {customer.email}
                                  </a>
                                </>
                              ) : (
                                'Not provided'
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm page-subtitle">Phone</Label>
                            <p className="text-white flex items-center">
                              {customer.phone ? (
                                <>
                                  <Phone className="w-4 h-4 mr-2 text-secondary" />
                                  <a href={`tel:${customer.phone}`} className="text-blue-400 hover:underline">
                                    {customer.phone}
                                  </a>
                                </>
                              ) : (
                                'Not provided'
                              )}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm page-subtitle">Address</Label>
                          <p className="text-white">
                            {[customer.address, customer.city, customer.state, customer.postal_code, customer.country]
                              .filter(Boolean)
                              .join(', ') || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm page-subtitle">Communication Preferences</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {customer.communication_preferences ? (
                              Object.entries(customer.communication_preferences as Record<string, boolean>).map(([method, enabled]: [string, boolean]) => (
                                enabled && (
                                  <Badge key={method} variant="outline" className="text-xs">
                                    {method.charAt(0).toUpperCase() + method.slice(1)}
                                  </Badge>
                                )
                              ))
                            ) : (
                              <p className="page-subtitle">Not specified</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="billing" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm page-subtitle">Credit Limit</Label>
                            <p className="text-white flex items-center">
                              <DollarSign className="w-4 h-4 mr-1 text-secondary" />
                              {customer.credit_limit ? `$${customer.credit_limit.toLocaleString()}` : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm page-subtitle">Payment Terms</Label>
                            <p className="text-white">{customer.payment_terms || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm page-subtitle">Tax ID</Label>
                            <p className="text-white">{customer.tax_id || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-sm page-subtitle">Lifetime Value</Label>
                            <p className="text-green-400 font-medium flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              {customer.lifetime_value ? `$${customer.lifetime_value.toLocaleString()}` : '$0'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm page-subtitle">Billing Address</Label>
                          <p className="text-white">
                            {[customer.billing_address, customer.billing_city, customer.billing_state, customer.billing_postal_code, customer.billing_country]
                              .filter(Boolean)
                              .join(', ') || 'Same as contact address'}
                          </p>
                        </div>
                      </TabsContent>
                      <TabsContent value="activity" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm page-subtitle">Created</Label>
                            <p className="text-white flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-secondary" />
                              {customer.created_at ? format(new Date(customer.created_at), 'PPP') : 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm page-subtitle">Last Activity</Label>
                            <p className="text-white flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-secondary" />
                              {customer.last_activity_date ? format(new Date(customer.last_activity_date), 'PPP') : 'No recent activity'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm page-subtitle">Last Activity Type</Label>
                          <p className="text-white">{customer.last_activity_type || 'No activity recorded'}</p>
                        </div>
                        <div className="bg-list-item/30 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-white mb-2">Recent Activity</h4>
                          <p className="text-sm page-subtitle">Activity tracking integration coming soon...</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="portal" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm page-subtitle">Portal Access</Label>
                            <p className="text-white flex items-center">
                              {customer.portal_access ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                  <span className="text-green-400">Enabled</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 mr-2 text-secondary" />
                                  <span className="page-subtitle">Disabled</span>
                                </>
                              )}
                            </p>
                          </div>
                          {customer.portal_access && customer.portal_username && (
                            <div>
                              <Label className="text-sm page-subtitle">Portal Username</Label>
                              <p className="text-white">{customer.portal_username}</p>
                            </div>
                          )}
                        </div>
                        {customer.portal_access && (
                          <div className="bg-list-item/30 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-white mb-2">Portal Features</h4>
                            <ul className="text-sm text-secondary space-y-1">
                              <li>• View account information</li>
                              <li>• Download invoices and statements</li>
                              <li>• Submit support requests</li>
                              <li>• Track project progress</li>
                              <li>• Manage communication preferences</li>
                            </ul>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Name *</Label>
                  <Input
                    id="edit_name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company">Company</Label>
                  <Input
                    id="edit_company"
                    value={customerData.company}
                    onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_customer_type">Client Type</Label>
                  <Select
                    value={customerData.type}
                    onValueChange={(value: CustomerType) => setCustomerData({ ...customerData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={customerData.status}
                    onValueChange={(value: CustomerStatus) => setCustomerData({ ...customerData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_industry">Industry</Label>
                  <Input
                    id="edit_industry"
                    value={customerData.industry}
                    onChange={(e) => setCustomerData({ ...customerData, industry: e.target.value })}
                    placeholder="e.g., Technology, Manufacturing"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_website">Website</Label>
                  <Input
                    id="edit_website"
                    value={customerData.website}
                    onChange={(e) => setCustomerData({ ...customerData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={customerData.notes}
                  onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                  placeholder="Additional notes about this client..."
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_address">Address</Label>
                <Input
                  id="edit_address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_city">City</Label>
                  <Input
                    id="edit_city"
                    value={customerData.city}
                    onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_state">State</Label>
                  <Input
                    id="edit_state"
                    value={customerData.state}
                    onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_postal_code">Postal Code</Label>
                  <Input
                    id="edit_postal_code"
                    value={customerData.postal_code}
                    onChange={(e) => setCustomerData({ ...customerData, postal_code: e.target.value })}
                    placeholder="ZIP"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_country">Country</Label>
                <Input
                  id="edit_country"
                  value={customerData.country}
                  onChange={(e) => setCustomerData({ ...customerData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </TabsContent>
            <TabsContent value="billing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_credit_limit">Credit Limit</Label>
                  <Input
                    id="edit_credit_limit"
                    type="number"
                    value={customerData.credit_limit || ''}
                    onChange={(e) => setCustomerData({ ...customerData, credit_limit: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_payment_terms">Payment Terms</Label>
                  <Input
                    id="edit_payment_terms"
                    value={customerData.payment_terms}
                    onChange={(e) => setCustomerData({ ...customerData, payment_terms: e.target.value })}
                    placeholder="Net 30"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_tax_id">Tax ID</Label>
                <Input
                  id="edit_tax_id"
                  value={customerData.tax_id}
                  onChange={(e) => setCustomerData({ ...customerData, tax_id: e.target.value })}
                  placeholder="Tax identification number"
                />
              </div>
              <div>
                <Label htmlFor="edit_billing_address">Billing Address</Label>
                <Input
                  id="edit_billing_address"
                  value={customerData.billing_address}
                  onChange={(e) => setCustomerData({ ...customerData, billing_address: e.target.value })}
                  placeholder="Billing street address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_billing_city">Billing City</Label>
                  <Input
                    id="edit_billing_city"
                    value={customerData.billing_city}
                    onChange={(e) => setCustomerData({ ...customerData, billing_city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_billing_state">Billing State</Label>
                  <Input
                    id="edit_billing_state"
                    value={customerData.billing_state}
                    onChange={(e) => setCustomerData({ ...customerData, billing_state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_billing_postal_code">Billing ZIP</Label>
                  <Input
                    id="edit_billing_postal_code"
                    value={customerData.billing_postal_code}
                    onChange={(e) => setCustomerData({ ...customerData, billing_postal_code: e.target.value })}
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preferences" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_portal_access"
                    checked={customerData.portal_access}
                    onCheckedChange={(checked) => setCustomerData({ ...customerData, portal_access: !!checked })}
                  />
                  <Label htmlFor="edit_portal_access">Grant Portal Access</Label>
                </div>
                {customerData.portal_access && (
                  <div>
                    <Label htmlFor="edit_portal_username">Portal Username</Label>
                    <Input
                      id="edit_portal_username"
                      value={customerData.portal_username}
                      onChange={(e) => setCustomerData({ ...customerData, portal_username: e.target.value })}
                      placeholder="portal.username"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label className="text-base font-medium">Communication Preferences</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_comm_email"
                      checked={customerData.communication_preferences.email}
                      onCheckedChange={(checked) => setCustomerData({
                        ...customerData,
                        communication_preferences: {
                          ...customerData.communication_preferences,
                          email: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="edit_comm_email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_comm_phone"
                      checked={customerData.communication_preferences.phone}
                      onCheckedChange={(checked) => setCustomerData({
                        ...customerData,
                        communication_preferences: {
                          ...customerData.communication_preferences,
                          phone: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="edit_comm_phone">Phone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_comm_sms"
                      checked={customerData.communication_preferences.sms}
                      onCheckedChange={(checked) => setCustomerData({
                        ...customerData,
                        communication_preferences: {
                          ...customerData.communication_preferences,
                          sms: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="edit_comm_sms">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_comm_postal"
                      checked={customerData.communication_preferences.postal}
                      onCheckedChange={(checked) => setCustomerData({
                        ...customerData,
                        communication_preferences: {
                          ...customerData.communication_preferences,
                          postal: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="edit_comm_postal">Postal Mail</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={!customerData.name}>
              Update Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingCustomer?.name}&quot; and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedCustomers.length} selected clients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Update Status</Label>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => handleBulkStatusUpdate('active')}>
                  Set Active
                </Button>
                <Button size="sm" onClick={() => handleBulkStatusUpdate('inactive')}>
                  Set Inactive
                </Button>
                <Button size="sm" onClick={() => handleBulkStatusUpdate('suspended')}>
                  Suspend
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}