"use client";

import { SearchIcon } from "lucide-react";
import ThemeToggleDropdown from "./ThemeToggleDropdown";
import NotificationDropdown from "./NotificationDropdown";
import UserProfileDropdown from "./UserProfileDropdown";

export default function Header() {
  return (
    <header className="app-header">
      {/* Search Bar */}
      <div className="header-search-container">
        <SearchIcon className="header-search-icon" />
        <input
          type="text"
          placeholder="Search clients, orders, products..."
          className="header-search-input"
        />
      </div>

      {/* Right Section: Theme, Notifications, User */}
      <div className="header-icon-group">
        <ThemeToggleDropdown />
        <NotificationDropdown />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
