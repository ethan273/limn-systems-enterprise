'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  onSuccess?: () => void;
}

const USER_TYPES = [
  { value: 'employee', label: 'Employee' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'designer', label: 'Designer' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'finance', label: 'Finance' },
  { value: 'super_admin', label: 'Super Admin' },
] as const;

export function CreateUserModal({ open, onOpenChange, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    userType: 'employee',
    title: '',
    department: '',
  });

  const createUserMutation = api.admin.users.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User created successfully! An invitation email will be sent.',
      });
      onOpenChange(false);
      onSuccess?.();
      setFormData({
        email: '',
        userType: 'employee',
        title: '',
        department: '',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    await createUserMutation.mutateAsync({
      email: formData.email.trim(),
      userType: formData.userType as any,
      title: formData.title.trim() || undefined,
      department: formData.department.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setFormData({
      email: '',
      userType: 'employee',
      title: '',
      department: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-content sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive an invitation email to set up their account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">User Type *</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
              >
                <SelectTrigger id="userType" className="select-trigger">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Designer"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Design"
                className="input-field"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createUserMutation.isPending}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="btn-primary"
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
