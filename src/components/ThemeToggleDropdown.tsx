"use client";
import { log } from '@/lib/logger';

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ThemeToggleDropdown() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="header-icon-button"
          aria-label={`Toggle theme (currently ${theme || 'system'})`}
        >
          {theme === "light" ? (
            <Sun className="w-5 h-5" aria-hidden="true" />
          ) : theme === "dark" ? (
            <Moon className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Monitor className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        sideOffset={8}
      >
        <DropdownMenuItem
          onClick={() => {
            log.info('Light mode clicked!');
            setTheme("light");
          }}
          onSelect={() => {
            log.info('Light mode selected!');
            setTheme("light");
          }}
          className="cursor-pointer"
        >
          <Sun className="w-4 h-4 mr-2 pointer-events-none" aria-hidden="true" />
          <span className="pointer-events-none">Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            log.info('Dark mode clicked!');
            setTheme("dark");
          }}
          onSelect={() => {
            log.info('Dark mode selected!');
            setTheme("dark");
          }}
          className="cursor-pointer"
        >
          <Moon className="w-4 h-4 mr-2 pointer-events-none" aria-hidden="true" />
          <span className="pointer-events-none">Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            log.info('System mode clicked!');
            setTheme("system");
          }}
          onSelect={() => {
            log.info('System mode selected!');
            setTheme("system");
          }}
          className="cursor-pointer"
        >
          <Monitor className="w-4 h-4 mr-2 pointer-events-none" aria-hidden="true" />
          <span className="pointer-events-none">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
