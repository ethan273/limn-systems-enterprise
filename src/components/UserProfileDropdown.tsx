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
  const { data: user } = api.userProfile.getCurrentUser.useQuery();
  const userData = user as any;
  const supabase = getSupabaseBrowserClient();

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push('/login');
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
          <p className="text-sm font-medium">{userData?.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{userData?.email}</p>
          {userData?.user_type && (
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {userData.user_type} {userData?.department ? `• ${userData.department}` : ''}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
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
