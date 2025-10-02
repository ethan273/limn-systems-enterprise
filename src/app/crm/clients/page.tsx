"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Customer } from "@/lib/db";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Building,
  Mail,
  Phone,
  Edit,
  Trash,
  Eye,
  Package,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type CustomerStatus = "active" | "inactive" | "pending" | "suspended";
type CustomerType = "individual" | "business" | "enterprise";

interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: CustomerType;
  status: CustomerStatus;
  notes?: string;
}

const defaultCustomerData: CreateCustomerData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  type: "business",
  status: "active",
  notes: "",
};

export default function ClientsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CustomerType | "all">("all");
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
      toast.success("Client created successfully");
      setShowCreateDialog(false);
      setCustomerData(defaultCustomerData);
      refetch();
    },
    onError: (error) => {
      toast.error("Error creating client: " + error.message);
    },
  });

  const updateCustomer = api.crm.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      setShowEditDialog(false);
      setEditingCustomer(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Error updating client: " + error.message);
    },
  });

  const deleteCustomer = api.crm.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Error deleting client: " + error.message);
    },
  });

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesType = typeFilter === "all" || customer.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [customers, searchTerm, statusFilter, typeFilter]);

  // Customer stats
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "active").length;
    const totalValue = customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;

    return { total, active, totalValue, averageValue };
  }, [customers]);

  const handleCreateCustomer = () => {
    if (!customerData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    createCustomer.mutate(customerData);
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer || !customerData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    updateCustomer.mutate({
      id: editingCustomer.id,
      ...customerData,
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteCustomer.mutate({ id: customerId });
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      type: customer.type as CustomerType,
      status: customer.status as CustomerStatus,
      notes: customer.notes || "",
    });
    setShowEditDialog(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      active: "status-completed",
      inactive: "status-cancelled",
      pending: "status-in-progress",
      suspended: "status-cancelled",
    };

    const className = statusClasses[status as keyof typeof statusClasses] || "badge-neutral";
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeClasses: Record<string, string> = {
      individual: "priority-low",
      business: "priority-medium",
      enterprise: "priority-high",
    };

    const className = typeClasses[type as keyof typeof typeClasses] || "badge-neutral";
    return (
      <Badge variant="outline" className={className}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your customer relationships and accounts</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="icon-sm" aria-hidden="true" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription className="page-subtitle">
                Add a new client to your CRM system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="col-span-3 card"
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Company
                </Label>
                <Input
                  id="company"
                  value={customerData.company}
                  onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="col-span-3 card"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_type" className="text-right">
                  Client Type
                </Label>
                <Select
                  value={customerData.type}
                  onValueChange={(value: CustomerType) => setCustomerData({ ...customerData, type: value })}
                >
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="card">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={customerData.status}
                  onValueChange={(value: CustomerStatus) => setCustomerData({ ...customerData, status: value })}
                >
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="card">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={customerData.notes}
                  onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                  className="col-span-3 card"
                  placeholder="Additional notes about this client..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={!customerData.name || createCustomer.isPending}
                className="btn-primary"
              >
                {createCustomer.isPending ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription className="page-subtitle">
                Update client information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="edit_name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="col-span-3 card"
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_company" className="text-right">
                  Company
                </Label>
                <Input
                  id="edit_company"
                  value={customerData.company}
                  onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="col-span-3 card"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit_phone"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_customer_type" className="text-right">
                  Client Type
                </Label>
                <Select
                  value={customerData.type}
                  onValueChange={(value: CustomerType) => setCustomerData({ ...customerData, type: value })}
                >
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="card">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_status" className="text-right">
                  Status
                </Label>
                <Select
                  value={customerData.status}
                  onValueChange={(value: CustomerStatus) => setCustomerData({ ...customerData, status: value })}
                >
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="card">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="edit_notes"
                  value={customerData.notes}
                  onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                  className="col-span-3 card"
                  placeholder="Additional notes about this client..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCustomer}
                disabled={!customerData.name || updateCustomer.isPending}
                className="btn-primary"
              >
                {updateCustomer.isPending ? "Updating..." : "Update Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Total Clients</p>
                <p className="text-xl font-bold text-primary">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Package className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Active</p>
                <p className="text-xl font-bold text-primary">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Total Value</p>
                <p className="text-xl font-bold text-primary">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm page-subtitle">Avg Value</p>
                <p className="text-xl font-bold text-primary">${Math.round(stats.averageValue).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card">
        <CardHeader className="card-header-sm">
          <CardTitle className="card-title-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="filters-section">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-muted" aria-hidden="true" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 card"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value: CustomerStatus | "all") => setStatusFilter(value)}
            >
              <SelectTrigger className="card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="card">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(value: CustomerType | "all") => setTypeFilter(value)}
            >
              <SelectTrigger className="card">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="card">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} className="btn-secondary">
              <Filter className="icon-sm" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="card">
        <CardHeader className="card-header-sm">
          <CardTitle className="card-title-sm">
            Clients ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="data-table-container">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading clients...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <Building className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No clients found</h3>
              <p className="empty-state-description">
                Try adjusting your filters or create a new client to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="data-table-header-row">
                  <TableHead className="data-table-header">Name</TableHead>
                  <TableHead className="data-table-header">Company</TableHead>
                  <TableHead className="data-table-header">Type</TableHead>
                  <TableHead className="data-table-header">Email</TableHead>
                  <TableHead className="data-table-header">Phone</TableHead>
                  <TableHead className="data-table-header">Status</TableHead>
                  <TableHead className="data-table-header">Created</TableHead>
                  <TableHead className="data-table-header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="data-table-row"
                    onClick={() => router.push(`/crm/clients/${customer.id}`)}
                  >
                    <TableCell className="data-table-cell-primary">
                      <div className="flex items-center gap-3">
                        <div className="data-table-avatar">
                          <Users className="icon-sm" aria-hidden="true" />
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {customer.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="icon-xs text-muted" aria-hidden="true" />
                          <span>{customer.company}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {customer.type ? getTypeBadge(customer.type) : <span className="text-muted">—</span>}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {customer.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="icon-xs text-muted" aria-hidden="true" />
                          <span className="truncate max-w-[200px]">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="icon-xs text-muted" aria-hidden="true" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {customer.status ? getStatusBadge(customer.status) : <span className="text-muted">—</span>}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {customer.created_at && (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell-actions">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="btn-icon">
                            <MoreVertical className="icon-sm" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="card">
                          <DropdownMenuItem
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/crm/clients/${customer.id}`);
                            }}
                          >
                            <Eye className="icon-sm" aria-hidden="true" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(customer);
                            }}
                          >
                            <Edit className="icon-sm" aria-hidden="true" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(customer.id);
                            }}
                          >
                            <Trash className="icon-sm" aria-hidden="true" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
