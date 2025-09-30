"use client";

import { useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Building,
  Mail,
  Phone,
  User,
  Tag,
  Edit,
  Trash,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showBulkOps, setShowBulkOps] = useState(false);

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

  const _handleContactUpdate = () => {
    refetch();
  };

  const toggleContactExpanded = (contactId: string) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedContacts(newExpanded);
  };

  const handleContactSelection = (contactId: string, selected: boolean) => {
    setSelectedContacts(prev => {
      if (selected) {
        const newSelection = [...prev, contactId];
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      } else {
        const newSelection = prev.filter(id => id !== contactId);
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      }
    });
  };

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Contacts</h1>
          <p className="text-muted-foreground">Manage all your business contacts</p>
        </div>
        <div className="flex items-center gap-3">
          {showBulkOps && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <span className="text-sm text-blue-300">{selectedContacts.length} selected</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => {
                  if (confirm(`Delete ${selectedContacts.length} selected contacts?`)) {
                    selectedContacts.forEach(id => deleteContactMutation.mutate({ id }));
                    setSelectedContacts([]);
                    setShowBulkOps(false);
                  }
                }}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Create New Contact</DialogTitle>
                <DialogDescription className="text-gray-400">
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Contact Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Edit Contact</DialogTitle>
                <DialogDescription className="text-gray-400">
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Filters</CardTitle>
        </CardHeader>
        <CardContent className="filters-section">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>

            {/* Company Filter */}
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="with_company">With Company</SelectItem>
                <SelectItem value="no_company">No Company</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">
            Contacts ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="mb-4">
                  <User className="h-12 w-12 mx-auto text-gray-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                <p className="text-sm">Try adjusting your filters or create a new contact to get started.</p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isExpanded = expandedContacts.has(contact.id);
                const isSelected = selectedContacts.includes(contact.id);

                return (
                  <Collapsible key={contact.id} open={isExpanded}>
                    <div className={`rounded-lg border transition-colors ${
                      isExpanded
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                    }`}>
                      <CollapsibleTrigger
                        className="w-full p-4 text-left"
                        onClick={() => toggleContactExpanded(contact.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactSelection(contact.id, !isSelected);
                            }}
                            className="p-1 h-auto hover:bg-gray-600 rounded cursor-pointer flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Contact Avatar */}
                          <Avatar className="h-10 w-10 border border-gray-600">
                            <AvatarFallback className="bg-gray-600 text-white">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Expand Icon */}
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-medium text-primary truncate">{contact.name}</h3>
                                  {contact.position && (
                                    <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/30">
                                      {contact.position}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  {contact.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{contact.email}</span>
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{contact.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Company Info */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {contact.company ? (
                                  <div className="flex items-center gap-1 text-sm text-gray-400">
                                    <Building className="h-4 w-4" />
                                    <span>{contact.company}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No company</span>
                                )}
                              </div>
                            </div>

                            {/* Tags */}
                            {contact.tags && contact.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {contact.tags.slice(0, 3).map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs text-tertiary border-gray-600">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {contact.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-tertiary border-gray-600">
                                    +{contact.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {contact.created_at && (
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div
                                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-600 h-9 px-3 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem
                                  className="text-sm hover:bg-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditContact(contact);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm hover:bg-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendEmail(contact);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm text-red-400 hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteContact(contact.id);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Expandable Content */}
                      <CollapsibleContent>
                        <Separator className="bg-gray-700" />
                        <div className="p-4 pt-6 bg-gray-800/80">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Contact Details */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Contact Information</h4>
                              <div className="space-y-3">
                                {contact.email && (
                                  <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{contact.email}</span>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{contact.phone}</span>
                                  </div>
                                )}
                                {contact.company && (
                                  <div className="flex items-center gap-3">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{contact.company}</span>
                                  </div>
                                )}
                                {contact.position && (
                                  <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{contact.position}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Notes & Activity */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Notes & Activity</h4>
                              {contact.notes ? (
                                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                  <p className="text-sm text-gray-300">{contact.notes}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No notes available</p>
                              )}

                              {/* Placeholder for future activity feed */}
                              <div className="text-xs text-gray-500">
                                Activity tracking coming soon...
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {contactsData && contactsData.total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, contactsData.total)} of {contactsData.total} contacts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!contactsData.hasMore}
                  className="border-gray-600 hover:bg-gray-700"
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