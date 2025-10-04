"use client";

import { BellIcon, SearchIcon, UserIcon, MessageSquareIcon } from "lucide-react";
import { useState } from "react";

export default function Header() {
 const [notifications] = useState(3);

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

 {/* Right Section */}
 <div className="header-actions">
 {/* Messages */}
 <button className="header-icon-button" aria-label="Open messages">
 <MessageSquareIcon className="w-5 h-5" aria-hidden="true" />
 </button>

 {/* Notifications */}
 <button className="header-icon-button" aria-label={`Open notifications${notifications > 0 ? ` (${notifications} unread)` : ''}`}>
 <BellIcon className="w-5 h-5" aria-hidden="true" />
 {notifications > 0 && (
 <span className="notification-badge" aria-hidden="true">
 {notifications}
 </span>
 )}
 </button>

 {/* User Menu */}
 <button className="header-icon-button" aria-label="Open user menu">
 <UserIcon className="w-5 h-5" aria-hidden="true" />
 </button>
 </div>
 </header>
 );
}
