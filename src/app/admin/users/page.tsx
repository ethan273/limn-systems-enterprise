"use client";

import { UserManagementPanel } from '@/components/admin/UserManagementPanel';

export default function AdminUsersPage() {
  return (
    <div className="admin-users-page">
      <div className="page-header">
        <h1 className="page-title">User & Permission Management</h1>
        <p className="page-subtitle">Manage system users, roles, and module access permissions</p>
      </div>
      <UserManagementPanel />
    </div>
  );
}
