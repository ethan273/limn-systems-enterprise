'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api/client';
import { User } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger not used
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  // Users not used
  UserPlus,
  Search,
  X,
  ChevronDown,
  Building2,
  Mail,
  // Phone not used
} from 'lucide-react';

interface CRMAssignmentSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (_userIds: string[]) => void;
  label?: string;
  placeholder?: string;
  maxAssignees?: number;
  showUserDetails?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

interface UserSelectorDialogProps {
  selectedUserIds: string[];
  onSelectionChange: (_userIds: string[]) => void;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  maxAssignees?: number;
}

function UserSelectorDialog({
  selectedUserIds,
  onSelectionChange,
  open,
  onOpenChange,
  maxAssignees,
}: UserSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const { data: usersData, isLoading } = api.users.getAllUsers.useQuery({ limit: 100 });
  const users = usersData?.users || [];

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.job_title && user.job_title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(new Set(users.map((user: User) => user.department).filter(Boolean)));

  const handleUserToggle = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      if (!maxAssignees || selectedUserIds.length < maxAssignees) {
        onSelectionChange([...selectedUserIds, userId]);
      }
    } else {
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    const allUserIds = filteredUsers.map((user: User) => user.id);
    const limitedUserIds = maxAssignees
      ? allUserIds.slice(0, maxAssignees)
      : allUserIds;
    onSelectionChange(limitedUserIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Assign Users</DialogTitle>
          <DialogDescription>
            Select users to assign to this CRM record
            {maxAssignees && ` (max ${maxAssignees})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-700 bg-gray-800 text-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept as string} value={dept as string}>
                  {(dept as string).charAt(0).toUpperCase() + (dept as string).slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-400">
              {selectedUserIds.length} users selected
              {maxAssignees && ` of ${maxAssignees} max`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>

          {/* User List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No users found</div>
            ) : (
              filteredUsers.map((user: User) => {
                const isSelected = selectedUserIds.includes(user.id);
                const isDisabled = !isSelected && maxAssignees && selectedUserIds.length >= maxAssignees;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleUserToggle(user.id, Boolean(checked))}
                      disabled={Boolean(isDisabled)}
                    />
                    <Avatar className="w-10 h-10">
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{user.name}</p>
                        {user.department && (
                          <Badge variant="outline" className="text-xs">
                            {user.department}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.job_title && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {user.job_title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CRMAssignmentSelector({
  selectedUserIds,
  onSelectionChange,
  label = 'Assigned To',
  placeholder = 'Select users...',
  maxAssignees,
  showUserDetails = true,
  className = '',
  variant = 'default',
}: CRMAssignmentSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [_isPopoverOpen, _setIsPopoverOpen] = useState(false);

  const { data: usersData } = api.users.getAllUsers.useQuery({ limit: 100 });
  const users = usersData?.users || [];

  const selectedUsers = users.filter((user: User) => selectedUserIds.includes(user.id));

  const removeUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId));
  };

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedUsers.length === 0
              ? placeholder
              : `${selectedUsers.length} user${selectedUsers.length === 1 ? '' : 's'} selected`
            }
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        <UserSelectorDialog
          selectedUserIds={selectedUserIds}
          onSelectionChange={onSelectionChange}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          maxAssignees={maxAssignees}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {variant !== 'detailed' && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          {variant === 'detailed' && (
            <Label className="text-sm font-medium">
              {label} ({selectedUsers.length})
            </Label>
          )}
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user: User) => (
              <div
                key={user.id}
                className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700"
              >
                <Avatar className="w-6 h-6">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {user.name}
                  </span>
                  {showUserDetails && user.job_title && (
                    <span className="text-xs text-gray-400 truncate">
                      {user.job_title}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUser(user.id)}
                  className="h-6 w-6 p-0 hover:bg-red-500/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Users Button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2"
          disabled={Boolean(maxAssignees && selectedUserIds.length >= maxAssignees)}
        >
          <UserPlus className="w-4 h-4" />
          {selectedUsers.length === 0 ? 'Assign Users' : 'Add More Users'}
        </Button>

        {selectedUsers.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => onSelectionChange([])}
            className="text-gray-400 hover:text-red-400"
          >
            Clear All
          </Button>
        )}
      </div>

      {maxAssignees && (
        <p className="text-xs text-gray-400">
          {selectedUserIds.length} of {maxAssignees} maximum assignees
        </p>
      )}

      <UserSelectorDialog
        selectedUserIds={selectedUserIds}
        onSelectionChange={onSelectionChange}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        maxAssignees={maxAssignees}
      />
    </div>
  );
}

// Simplified version for quick assignment
export function QuickUserSelector({
  selectedUserIds,
  onSelectionChange,
  className = '',
}: {
  selectedUserIds: string[];
  onSelectionChange: (_userIds: string[]) => void;
  className?: string;
}) {
  return (
    <CRMAssignmentSelector
      selectedUserIds={selectedUserIds}
      onSelectionChange={onSelectionChange}
      variant="compact"
      className={className}
      showUserDetails={false}
    />
  );
}

// Detailed version for comprehensive assignment
export function DetailedUserSelector({
  selectedUserIds,
  onSelectionChange,
  maxAssignees,
  className = '',
}: {
  selectedUserIds: string[];
  onSelectionChange: (_userIds: string[]) => void;
  maxAssignees?: number;
  className?: string;
}) {
  return (
    <CRMAssignmentSelector
      selectedUserIds={selectedUserIds}
      onSelectionChange={onSelectionChange}
      variant="detailed"
      maxAssignees={maxAssignees}
      className={className}
      showUserDetails={true}
    />
  );
}