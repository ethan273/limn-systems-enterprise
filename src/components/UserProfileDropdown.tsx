"use client";

import { UserIcon, Settings, LogOut } from "lucide-react";
import { api } from "@/lib/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function UserProfileDropdown() {
  const router = useRouter();
  const { data: user, error, isError } = api.userProfile.getCurrentUser.useQuery(undefined, {
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const userData = user as any;
  const _supabase = getSupabaseBrowserClient();

  // Debug logging (dev only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[UserProfileDropdown] User data:', { userData, isError, error });
  }

  // Don't render if user not found
  if (isError || !userData) {
    // User not logged in or session expired
    if (isError && process.env.NODE_ENV !== 'production') {
      console.warn('[UserProfileDropdown] User not authenticated:', error?.message);
    }
    return null;
  }

  const handleSignOut = async () => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[UserProfileDropdown] Signing out...');
      }

      // Clear all auth cookies manually
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Call server-side logout API for proper session cleanup
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok && process.env.NODE_ENV !== 'production') {
          console.log('[UserProfileDropdown] ✅ Sign out successful');
        }
      } catch (apiError) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[UserProfileDropdown] API logout failed (continuing anyway):', apiError);
        }
      }

      // Always redirect to login
      window.location.href = '/login';
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[UserProfileDropdown] Sign out exception:', error);
      }
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="header-icon-button"
          aria-label="Open user menu"
        >
          {userData?.avatar_url ? (
            <Image
              src={userData.avatar_url}
              alt={userData.name || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        sideOffset={8}
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{userData?.name || 'Unknown User'}</p>
          <p className="text-xs text-muted-foreground">{userData?.email || 'No email available'}</p>
          {userData?.user_type && (
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {userData.user_type.replace('_', ' ')} {userData?.department ? `• ${userData.department}` : ''}
            </p>
          )}
        </div>
        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          onSelect={() => router.push('/settings')}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSignOut()}
          onSelect={() => handleSignOut()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
