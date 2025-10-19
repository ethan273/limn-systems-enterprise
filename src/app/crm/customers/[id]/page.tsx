"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { EditableField, EditableFieldGroup } from "@/components/common";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Activity,
  ArrowLeft,
  Edit,
  MessageSquare,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
  X,
  Check,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getFullName, createFullName } from "@/lib/utils/name-utils";
import { AddressList } from "@/components/crm";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user: _user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, error } = api.crm.customers.getById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Form data state for in-place editing
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    type: '',
    status: '',
    notes: '',
  });

  // Sync form data with fetched customer data
  useEffect(() => {
    if (data?.customer) {
      setFormData({
        first_name: data.customer.first_name || '',
        last_name: data.customer.last_name || '',
        email: data.customer.email || '',
        phone: data.customer.phone || '',
        company: data.customer.company || '',
        type: data.customer.type || '',
        status: data.customer.status || '',
        notes: data.customer.notes || '',
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = api.crm.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      setIsEditing(false);
      // Invalidate queries for instant updates
      utils.crm.customers.getById.invalidate();
      utils.crm.customers.list.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to update client: " + error.message);
    },
  });

  // Address mutations - MUST be before any conditional returns
  const createAddressMutation = api.crm.addresses.create.useMutation({
    onSuccess: () => {
      utils.crm.customers.getById.invalidate();
    },
  });

  const updateAddressMutation = api.crm.addresses.update.useMutation({
    onSuccess: () => {
      utils.crm.customers.getById.invalidate();
    },
  });

  const deleteAddressMutation = api.crm.addresses.delete.useMutation({
    onSuccess: () => {
      utils.crm.customers.getById.invalidate();
    },
  });

  const handleSave = async () => {
    if (!formData.first_name) {
      toast.error("First name is required");
      return;
    }

    const fullName = createFullName(formData.first_name, formData.last_name);
    await updateMutation.mutateAsync({
      id,
      data: {
        first_name: formData.first_name,
        last_name: formData.last_name || undefined,
        name: fullName, // Maintain backward compatibility
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        type: formData.type || undefined,
        status: formData.status || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (data?.customer) {
      setFormData({
        first_name: data.customer.first_name || '',
        last_name: data.customer.last_name || '',
        email: data.customer.email || '',
        phone: data.customer.phone || '',
        company: data.customer.company || '',
        type: data.customer.type || '',
        status: data.customer.status || '',
        notes: data.customer.notes || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading client details..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button
            onClick={() => router.push("/crm/customers")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
          >
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Failed to Load Client</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || "An error occurred while fetching client data"}
              </p>
            </div>
            <button
              onClick={() => utils.crm.customers.getById.invalidate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <EmptyState
          icon={User}
          title="Client Not Found"
          description="The client you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Clients',
            onClick: () => router.push("/crm/customers"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const customer = data.customer;
  const orders = (data as any).orders || [];
  const invoices = (data as any).invoices || [];
  const addresses = (data as any).addresses || [];

  const handleAddAddress = async (address: any) => {
    await createAddressMutation.mutateAsync({
      ...address,
      customer_id: id,
    });
  };

  const handleUpdateAddress = async (addressId: string, address: any) => {
    await updateAddressMutation.mutateAsync({
      id: addressId,
      data: address,
    });
  };

  const handleDeleteAddress = async (addressId: string) => {
    await deleteAddressMutation.mutateAsync({ id: addressId });
  };

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/crm/customers")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Client Header */}
      <EntityDetailHeader
        icon={User}
        title={getFullName(formData) || "Unnamed Client"}
        subtitle={formData.company || undefined}
        metadata={[
          ...(formData.email ? [{ icon: Mail, value: formData.email, type: 'email' as const }] : []),
          ...(formData.phone ? [{ icon: Phone, value: formData.phone, type: 'phone' as const }] : []),
          ...(formData.type ? [{ icon: Building2, value: formData.type, label: 'Type' }] : []),
        ]}
        status={formData.status || 'active'}
        actions={
          isEditing
            ? [
                {
                  label: 'Cancel',
                  icon: X,
                  variant: 'outline' as const,
                  onClick: handleCancel,
                },
                {
                  label: updateMutation.isPending ? 'Saving...' : 'Save Changes',
                  icon: Check,
                  onClick: handleSave,
                  disabled: updateMutation.isPending,
                },
              ]
            : [
                {
                  label: 'Edit Client',
                  icon: Edit,
                  onClick: () => setIsEditing(true),
                },
              ]
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{orders.length || 0}</div>
            <p className="stat-label">
              <ShoppingCart className="icon-xs inline" aria-hidden="true" /> All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{invoices.length || 0}</div>
            <p className="stat-label">
              <FileText className="icon-xs inline" aria-hidden="true" /> All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value stat-success">${customer.lifetime_value?.toLocaleString() || 0}</div>
            <p className="stat-label">
              <DollarSign className="icon-xs inline" aria-hidden="true" /> Total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={formData.status || 'active'} />
            <p className="stat-label mt-2">Current status</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <Activity className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="tabs-trigger">
            <ShoppingCart className="icon-sm" aria-hidden="true" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="addresses" className="tabs-trigger">
            <MapPin className="icon-sm" aria-hidden="true" />
            Addresses ({addresses.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="tabs-trigger">
            <MessageSquare className="icon-sm" aria-hidden="true" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <EditableFieldGroup title="Client Information" isEditing={isEditing} columns={2}>
            <EditableField
              label="First Name"
              value={formData.first_name}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, first_name: value })}
              required
              icon={User}
            />

            <EditableField
              label="Last Name"
              value={formData.last_name}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, last_name: value })}
              icon={User}
            />

            <EditableField
              label="Company"
              value={formData.company}
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, company: value })}
              icon={Building2}
            />

            <EditableField
              label="Email"
              value={formData.email}
              type="email"
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, email: value })}
              icon={Mail}
            />

            <EditableField
              label="Phone"
              value={formData.phone}
              type="phone"
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              icon={Phone}
            />

            <EditableField
              label="Client Type"
              value={formData.type}
              type="select"
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, type: value })}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'business', label: 'Business' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
              icon={Package}
            />

            <EditableField
              label="Status"
              value={formData.status}
              type="select"
              isEditing={isEditing}
              onChange={(value) => setFormData({ ...formData, status: value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />

            <div className="col-span-2">
              <EditableField
                label="Created"
                value={customer.created_at ? format(new Date(customer.created_at), "MMM d, yyyy h:mm a") : "—"}
                isEditing={false}
                icon={Calendar}
              />
            </div>

            <div className="col-span-2">
              <EditableField
                label="Lifetime Value"
                value={customer.lifetime_value ? `$${customer.lifetime_value.toLocaleString()}` : "$0"}
                isEditing={false}
                icon={DollarSign}
              />
            </div>

            <div className="col-span-2">
              <EditableField
                label="Notes"
                value={formData.notes}
                type="textarea"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, notes: value })}
              />
            </div>
          </EditableFieldGroup>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Client Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="No Orders Yet"
                  description="Orders from this client will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {orders.map((order: any) => (
                    <div key={order.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{order.order_number || 'Order'}</span>
                        <StatusBadge status={order.status || 'pending'} />
                      </div>
                      {order.total_amount && (
                        <p className="text-sm text-muted-foreground">${order.total_amount.toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Client Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Invoices Yet"
                  description="Invoices for this client will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{invoice.invoice_number || 'Invoice'}</span>
                        <StatusBadge status={invoice.status || 'pending'} />
                      </div>
                      {invoice.total_amount && (
                        <p className="text-sm text-muted-foreground">${invoice.total_amount.toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Client Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressList
                addresses={addresses}
                onAdd={handleAddAddress}
                onUpdate={handleUpdateAddress}
                onDelete={handleDeleteAddress}
                isLoading={
                  createAddressMutation.isPending ||
                  updateAddressMutation.isPending ||
                  deleteAddressMutation.isPending
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Client Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <EditableField
                  label=""
                  value={formData.notes}
                  type="textarea"
                  isEditing={true}
                  onChange={(value) => setFormData({ ...formData, notes: value })}
                  className="min-h-[200px]"
                />
              ) : (
                formData.notes ? (
                  <div className="notes-content">
                    <p className="whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="No Notes"
                    description="Add notes about this client to keep track of important information."
                  />
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
