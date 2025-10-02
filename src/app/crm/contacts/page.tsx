"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
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
  User,
  Tag,
  Edit,
  Trash,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ContactsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for new contact
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    notes: "",
    tags: [] as string[],
  });

  // Form state for editing contact
  const [editContact, setEditContact] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    notes: "",
    tags: [] as string[],
  });

  const { data: contactsData, isLoading, refetch } = api.crm.contacts.getAll.useQuery({
    limit,
    offset: page * limit,
    orderBy: { name: 'asc' },
  });

  const createContactMutation = api.crm.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact created successfully");
      setIsCreateDialogOpen(false);
      setNewContact({
        name: "",
        email: "",
        phone: "",
        company: "",
        position: "",
        notes: "",
        tags: [],
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create contact: " + error.message);
    },
  });

  const updateContactMutation = api.crm.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update contact: " + error.message);
    },
  });

  const deleteContactMutation = api.crm.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete contact: " + error.message);
    },
  });

  const handleCreateContact = () => {
    if (!newContact.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    createContactMutation.mutate({
      name: newContact.name,
      email: newContact.email || undefined,
      phone: newContact.phone || undefined,
      company: newContact.company || undefined,
      position: newContact.position || undefined,
      notes: newContact.notes || undefined,
      tags: newContact.tags,
    });
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate({ id: contactId });
    }
  };

  const handleEditContact = (contact: any) => {
    setEditContact({
      id: contact.id,
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      position: contact.position || "",
      notes: contact.notes || "",
      tags: contact.tags || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = () => {
    if (!editContact.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    updateContactMutation.mutate({
      id: editContact.id,
      data: {
        name: editContact.name,
        email: editContact.email || undefined,
        phone: editContact.phone || undefined,
        company: editContact.company || undefined,
        position: editContact.position || undefined,
        notes: editContact.notes || undefined,
        tags: editContact.tags,
      },
    });

    setIsEditDialogOpen(false);
    setEditContact({
      id: "",
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      notes: "",
      tags: [],
    });
  };

  const handleSendEmail = (contact: any) => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`, '_blank');
    } else {
      toast.error("No email address available for this contact");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCompanyFilter('all');
    setPage(0);
  };

  // Filter contacts based on search and company filter
  const filteredContacts = contactsData?.items?.filter(contact => {
    const matchesSearch = !search ||
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase());

    const matchesCompany = companyFilter === 'all' ||
      (companyFilter === 'with_company' && contact.company) ||
      (companyFilter === 'no_company' && !contact.company);

    return matchesSearch && matchesCompany;
  }) || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Manage all your business contacts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="icon-sm" aria-hidden="true" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
              <DialogDescription className="page-subtitle">
                Add a new contact to your CRM system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
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
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Company
                </Label>
                <Input
                  id="company"
                  value={newContact.company}
                  onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">
                  Position
                </Label>
                <Input
                  id="position"
                  value={newContact.position}
                  onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Job title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={newContact.notes}
                  onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateContact}
                disabled={createContactMutation.isPending}
                className="btn-primary"
              >
                {createContactMutation.isPending ? "Creating..." : "Create Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription className="page-subtitle">
                Update contact information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="edit-name"
                  value={editContact.name}
                  onChange={(e) => setEditContact(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editContact.email}
                  onChange={(e) => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editContact.phone}
                  onChange={(e) => setEditContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="edit-company"
                  value={editContact.company}
                  onChange={(e) => setEditContact(prev => ({ ...prev, company: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-position" className="text-right">
                  Position
                </Label>
                <Input
                  id="edit-position"
                  value={editContact.position}
                  onChange={(e) => setEditContact(prev => ({ ...prev, position: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Job title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  value={editContact.notes}
                  onChange={(e) => setEditContact(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUpdateContact}
                disabled={updateContactMutation.isPending}
                className="btn-primary"
              >
                {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 card"
              />
            </div>

            {/* Company Filter */}
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="card">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent className="card">
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="with_company">With Company</SelectItem>
                <SelectItem value="no_company">No Company</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="btn-secondary"
            >
              <Filter className="icon-sm" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="card">
        <CardHeader className="card-header-sm">
          <CardTitle className="card-title-sm">
            Contacts ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="data-table-container">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="empty-state">
              <User className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No contacts found</h3>
              <p className="empty-state-description">
                Try adjusting your filters or create a new contact to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="data-table-header-row">
                  <TableHead className="data-table-header">Name</TableHead>
                  <TableHead className="data-table-header">Company</TableHead>
                  <TableHead className="data-table-header">Position</TableHead>
                  <TableHead className="data-table-header">Email</TableHead>
                  <TableHead className="data-table-header">Phone</TableHead>
                  <TableHead className="data-table-header">Tags</TableHead>
                  <TableHead className="data-table-header">Created</TableHead>
                  <TableHead className="data-table-header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="data-table-row"
                    onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                  >
                    <TableCell className="data-table-cell-primary">
                      <div className="flex items-center gap-3">
                        <div className="data-table-avatar">
                          <User className="icon-sm" aria-hidden="true" />
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {contact.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="icon-xs text-muted" aria-hidden="true" />
                          <span>{contact.company}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {contact.position || <span className="text-muted">—</span>}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {contact.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="icon-xs text-muted" aria-hidden="true" />
                          <span className="truncate max-w-[200px]">{contact.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {contact.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="icon-xs text-muted" aria-hidden="true" />
                          <span>{contact.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {contact.tags && contact.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {contact.tags.slice(0, 2).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="badge-neutral">
                              <Tag className="icon-xs" aria-hidden="true" />
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="outline" className="badge-neutral">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {contact.created_at && (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
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
                              router.push(`/crm/contacts/${contact.id}`);
                            }}
                          >
                            <Eye className="icon-sm" aria-hidden="true" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditContact(contact);
                            }}
                          >
                            <Edit className="icon-sm" aria-hidden="true" />
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendEmail(contact);
                            }}
                          >
                            <Mail className="icon-sm" aria-hidden="true" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact.id);
                            }}
                          >
                            <Trash className="icon-sm" aria-hidden="true" />
                            Delete Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {contactsData && contactsData.total > limit && (
            <div className="data-table-pagination">
              <div className="data-table-pagination-info">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, contactsData.total)} of {contactsData.total} contacts
              </div>
              <div className="data-table-pagination-controls">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn-secondary"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!contactsData.hasMore}
                  className="btn-secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
