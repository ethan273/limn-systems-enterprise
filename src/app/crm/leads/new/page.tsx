'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  User,
  Mail,
  Phone,
  Building2,
  Save,
  X,
  AlertCircle,
  TrendingUp,
  Target,
  Search,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { PageHeader, Breadcrumb } from '@/components/common';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'ads', label: 'Advertising' },
  { value: 'manual', label: 'Manual Entry' },
];

const INTEREST_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function NewLeadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Fetch all contacts for selection
  const { data: contactsData, isLoading: isLoadingContacts } = api.crm.contacts.getAll.useQuery({
    limit: 1000,
    offset: 0,
  });

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!contactsData?.items) return [];
    if (!searchQuery) return contactsData.items;

    const query = searchQuery.toLowerCase();
    return contactsData.items.filter((contact: any) => {
      const name = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const company = (contact.company || '').toLowerCase();
      return name.includes(query) || email.includes(query) || company.includes(query);
    });
  }, [contactsData, searchQuery]);

  const [formData, setFormData] = useState({
    contact_id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    lead_source: 'manual',
    interest_level: 'medium',
  });

  // When contact is selected, pre-populate all fields
  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setFormData({
      contact_id: contact.id,
      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      status: 'new',
      lead_source: 'manual',
      interest_level: 'medium',
    });
    setOpen(false);
    setError(null);
  };

  const createLead = api.crm.leads.create.useMutation({
    onSuccess: () => {
      toast.success('Lead created successfully');
      router.push('/crm/leads');
    },
    onError: (err) => {
      setError(err.message || 'Failed to create lead');
      setIsSubmitting(false);
      toast.error('Failed to create lead');
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.contact_id) {
      setError('Please select a contact first');
      setIsSubmitting(false);
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      setIsSubmitting(false);
      return;
    }

    createLead.mutate({
      contact_id: formData.contact_id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      status: formData.status,
      lead_source: formData.lead_source || undefined,
      interest_level: formData.interest_level || undefined,
      tags: [],
    });
  };

  const handleCancel = () => {
    router.push('/crm/leads');
  };

  return (
    <div className="page-container">
      <Breadcrumb />
      <PageHeader
        title="New Lead"
        subtitle="Select a contact to convert into a lead"
      />

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Step 1: Contact Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="contact">Search and Select Contact *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedContact ? (
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {selectedContact.first_name} {selectedContact.last_name}
                          {selectedContact.company && ` - ${selectedContact.company}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Search contacts...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by name, email, or company..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandEmpty>
                        {isLoadingContacts ? 'Loading contacts...' : 'No contacts found.'}
                      </CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {filteredContacts.map((contact: any) => (
                            <CommandItem
                              key={contact.id}
                              value={contact.id}
                              onSelect={() => handleContactSelect(contact)}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedContact?.id === contact.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {contact.first_name} {contact.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {contact.email}
                                  {contact.company && ` • ${contact.company}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">
                  All contact information will be automatically populated below
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Contact Information (Pre-populated, read-only) */}
          {selectedContact && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Contact Information (Auto-filled)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="pl-12 bg-muted/50"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="pl-12 bg-muted/50"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="pl-12 bg-muted/50"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        className="pl-12 bg-muted/50"
                        placeholder="Acme Corporation"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Lead-Specific Information */}
          {selectedContact && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Lead Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lead_source">Lead Source</Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={formData.lead_source}
                        onValueChange={(value) => handleChange('lead_source', value)}
                      >
                        <SelectTrigger id="lead_source" className="pl-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_SOURCES.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_level">Interest Level</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={formData.interest_level}
                        onValueChange={(value) => handleChange('interest_level', value)}
                      >
                        <SelectTrigger id="interest_level" className="pl-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTEREST_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {selectedContact && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.contact_id}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Lead
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
