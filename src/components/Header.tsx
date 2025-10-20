"use client";

import { useState, useEffect, useRef } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggleDropdown from "./ThemeToggleDropdown";
import NotificationDropdown from "./NotificationDropdown";
import UserProfileDropdown from "./UserProfileDropdown";
import { api } from "@/lib/api/client";

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search with debouncing
  const { data: searchResults, isLoading } = api.globalSearch.search.useQuery(
    { query: searchQuery, limit: 5 },
    {
      enabled: searchQuery.length >= 2,
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show results when we have a query
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery, searchResults]);

  const handleResultClick = (type: string, id: string) => {
    setShowResults(false);
    setSearchQuery("");

    // Navigate based on type
    const routes: Record<string, string> = {
      customer: `/crm/customers/${id}`,
      order: `/orders/${id}`,
      product: `/catalog/items/${id}`,
      contact: `/crm/contacts/${id}`,
      lead: `/crm/leads/${id}`,
    };

    const route = routes[type];
    if (route) {
      router.push(route);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
  };

  const totalResults = searchResults?.total || 0;
  const hasResults = totalResults > 0;

  return (
    <header className="app-header">
      {/* Search Bar */}
      <div className="header-search-container" ref={searchRef}>
        <SearchIcon className="header-search-icon" />
        <input
          type="text"
          placeholder="Search clients, orders, products..."
          className="header-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showResults && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
            {isLoading && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            )}

            {!isLoading && !hasResults && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No results found for "{searchQuery}"
              </div>
            )}

            {!isLoading && hasResults && (
              <div className="py-2">
                {/* Customers */}
                {searchResults?.customers && searchResults.customers.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Customers
                    </div>
                    {searchResults.customers.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.type, item.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {searchResults?.orders && searchResults.orders.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Orders
                    </div>
                    {searchResults.orders.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.type, item.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Products */}
                {searchResults?.products && searchResults.products.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Products
                    </div>
                    {searchResults.products.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.type, item.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Contacts */}
                {searchResults?.contacts && searchResults.contacts.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Contacts
                    </div>
                    {searchResults.contacts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.type, item.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Leads */}
                {searchResults?.leads && searchResults.leads.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Leads
                    </div>
                    {searchResults.leads.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.type, item.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  Showing {totalResults} result{totalResults !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}
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
