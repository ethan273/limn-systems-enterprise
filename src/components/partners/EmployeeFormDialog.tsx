'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingState } from '@/components/common/LoadingState';

const employeeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  employment_status: z.enum(['active', 'inactive', 'terminated', 'suspended']),
  employment_start_date: z.string().optional(),
  is_primary: z.boolean(),
  is_qc: z.boolean(),
  is_production: z.boolean(),
  is_finance: z.boolean(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  partnerType: 'factory' | 'designer' | 'sourcing';
  contactId?: string | null;
}

export function EmployeeFormDialog({
  isOpen,
  onClose,
  partnerId,
  partnerType,
  contactId,
}: EmployeeFormDialogProps) {
  const utils = api.useUtils();
  const isEditMode = !!contactId;

  // Fetch contact data if editing
  const { data: contact, isLoading: isLoadingContact } = api.partners.contacts.getById.useQuery(
    { id: contactId! },
    { enabled: isEditMode }
  );

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
      mobile: '',
      employee_id: '',
      department: '',
      employment_status: 'active',
      employment_start_date: '',
      is_primary: false,
      is_qc: false,
      is_production: false,
      is_finance: false,
      notes: '',
    },
  });

  // Update form when contact data loads
  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        employee_id: contact.employee_id || '',
        department: contact.department || '',
        employment_status: (contact.employment_status as 'active' | 'inactive' | 'terminated' | 'suspended') || 'active',
        employment_start_date: contact.employment_start_date
          ? new Date(contact.employment_start_date).toISOString().split('T')[0]
          : '',
        is_primary: contact.is_primary,
        is_qc: contact.is_qc,
        is_production: contact.is_production,
        is_finance: contact.is_finance,
        notes: contact.notes || '',
      });
    } else if (!isEditMode) {
      form.reset({
        name: '',
        role: '',
        email: '',
        phone: '',
        mobile: '',
        employee_id: '',
        department: '',
        employment_status: 'active',
        employment_start_date: '',
        is_primary: false,
        is_qc: false,
        is_production: false,
        is_finance: false,
        notes: '',
      });
    }
  }, [contact, isEditMode, form]);

  // Create mutation
  const createMutation = api.partners.contacts.create.useMutation({
    onSuccess: () => {
      utils.partners.contacts.list.invalidate();
      utils.partners.getById.invalidate();
      onClose();
      form.reset();
    },
  });

  // Update mutation
  const updateMutation = api.partners.contacts.update.useMutation({
    onSuccess: () => {
      utils.partners.contacts.list.invalidate();
      utils.partners.getById.invalidate();
      onClose();
      form.reset();
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    const payload = {
      ...data,
      partner_id: partnerId,
      employment_start_date: data.employment_start_date
        ? new Date(data.employment_start_date)
        : undefined,
      phone: data.phone || undefined,
      mobile: data.mobile || undefined,
      employee_id: data.employee_id || undefined,
      department: data.department || undefined,
      notes: data.notes || undefined,
    };

    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: contactId,
        ...payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update employee information and employment details.'
              : 'Add a new employee to your team. You can grant portal access later.'}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingContact ? (
          <LoadingState message="Loading employee details..." size="sm" />
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="John Doe"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-danger mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Job Title *</Label>
                  <Input
                    id="role"
                    {...form.register('role')}
                    placeholder="QC Inspector"
                  />
                  {form.formState.errors.role && (
                    <p className="text-sm text-danger mt-1">
                      {form.formState.errors.role.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="john@example.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-danger mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    {...form.register('mobile')}
                    placeholder="+1 (555) 987-6543"
                  />
                </div>

                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    {...form.register('employee_id')}
                    placeholder="EMP-001"
                  />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Employment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    {...form.register('department')}
                    placeholder="Quality Control"
                  />
                </div>

                <div>
                  <Label htmlFor="employment_status">Employment Status</Label>
                  <Select
                    value={form.watch('employment_status')}
                    onValueChange={(value) =>
                      form.setValue('employment_status', value as 'active' | 'inactive' | 'terminated' | 'suspended')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employment_start_date">Start Date</Label>
                  <Input
                    id="employment_start_date"
                    type="date"
                    {...form.register('employment_start_date')}
                  />
                </div>
              </div>
            </div>

            {/* Contact Roles */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contact Roles</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary"
                    checked={form.watch('is_primary')}
                    onCheckedChange={(checked) =>
                      form.setValue('is_primary', checked === true)
                    }
                  />
                  <Label htmlFor="is_primary">Primary Contact</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_qc"
                    checked={form.watch('is_qc')}
                    onCheckedChange={(checked) =>
                      form.setValue('is_qc', checked === true)
                    }
                  />
                  <Label htmlFor="is_qc">QC Contact</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_production"
                    checked={form.watch('is_production')}
                    onCheckedChange={(checked) =>
                      form.setValue('is_production', checked === true)
                    }
                  />
                  <Label htmlFor="is_production">Production Contact</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_finance"
                    checked={form.watch('is_finance')}
                    onCheckedChange={(checked) =>
                      form.setValue('is_finance', checked === true)
                    }
                  />
                  <Label htmlFor="is_finance">Finance Contact</Label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Additional notes about this employee..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Employee' : 'Add Employee'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
