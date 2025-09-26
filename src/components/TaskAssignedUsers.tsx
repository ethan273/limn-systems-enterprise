"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { User } from "@/lib/db";

interface TaskAssignedUsersProps {
  taskId: string;
  assignedUsers?: string[]; // Array of user IDs
  onUpdate?: () => void;
}

export default function TaskAssignedUsers({ taskId, assignedUsers = [], onUpdate }: TaskAssignedUsersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Local state for assigned users - this would be managed by the parent component in production
  const [localAssignedUsers, setLocalAssignedUsers] = useState<string[]>(assignedUsers);

  // Get all available users
  const { data: allUsersData, isLoading: isLoadingAllUsers } = api.users.getAllUsers.useQuery({
    limit: 100,
    search: searchQuery || undefined,
  });

  // Get assigned user details
  const { data: assignedUserDetails, isLoading: isLoadingAssigned } = api.users.getByIds.useQuery({
    ids: localAssignedUsers,
  }, { enabled: localAssignedUsers.length > 0 });

  const availableUsers = allUsersData?.users?.filter(user => !localAssignedUsers.includes(user.id)) || [];

  const updateAssignmentMutation = api.tasks.update.useMutation({
    onSuccess: () => {
      onUpdate?.();
    },
  });

  const addUser = (userId: string) => {
    if (!localAssignedUsers.includes(userId)) {
      const newAssignedUsers = [...localAssignedUsers, userId];
      setLocalAssignedUsers(newAssignedUsers);

      // Call the API to update the task assignment
      updateAssignmentMutation.mutate({
        id: taskId,
        assigned_to: newAssignedUsers,
      });
    }
    setIsAddDialogOpen(false);
    setSearchQuery("");
  };

  const removeUser = (userId: string) => {
    if (confirm("Are you sure you want to remove this user from the task?")) {
      const newAssignedUsers = localAssignedUsers.filter(id => id !== userId);
      setLocalAssignedUsers(newAssignedUsers);

      // Call the API to update the task assignment
      updateAssignmentMutation.mutate({
        id: taskId,
        assigned_to: newAssignedUsers,
      });
    }
  };

  const getUserInitials = (user: User) => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = parseInt(userId.slice(-1), 16) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Users className="h-4 w-4" />
          Assigned Users ({assignedUserDetails?.length || 0})
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign User</DialogTitle>
              <DialogDescription>
                Add a user to this task to assign them responsibility.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for a user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isLoadingAllUsers ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Loading users...</p>
                  </div>
                ) : availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-700/30 border border-gray-600/30"
                      onClick={() => addUser(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className={`text-xs font-medium text-white ${getUserColor(user.id)}`}>
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <UserPlus className="h-4 w-4 text-green-400" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No available users found</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setSearchQuery("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assigned Users List */}
      <div className="space-y-2">
        {isLoadingAssigned ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Loading assigned users...</p>
          </div>
        ) : assignedUserDetails && assignedUserDetails.length > 0 ? (
          assignedUserDetails.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 bg-gray-700/30 rounded border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className={`text-xs font-medium text-white ${getUserColor(user.id)}`}>
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => removeUser(user.id)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove from Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No users assigned</p>
            <p className="text-xs text-gray-600">Add users to assign them to this task</p>
          </div>
        )}
      </div>
    </div>
  );
}