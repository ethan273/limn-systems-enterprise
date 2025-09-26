"use client";

import { BellIcon, SearchIcon, UserIcon, MessageSquareIcon } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [notifications] = useState(3);

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients, orders, products..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Messages */}
        <button className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors">
          <MessageSquareIcon className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors">
          <BellIcon className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 p-2 text-gray-400 hover:text-gray-200 transition-colors">
          <UserIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}