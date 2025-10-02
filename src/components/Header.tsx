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
 <button className="header-icon-button">
 <MessageSquareIcon className="w-5 h-5" />
 </button>

 {/* Notifications */}
 <button className="header-icon-button">
 <BellIcon className="w-5 h-5" />
 {notifications > 0 && (
 <span className="notification-badge">
 {notifications}
 </span>
 )}
 </button>

 {/* User Menu */}
 <button className="header-icon-button">
 <UserIcon className="w-5 h-5" />
 </button>
 </div>
 </header>
 );
}
