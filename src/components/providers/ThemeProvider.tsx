"use client";

/**
 * Theme Provider
 *
 * Provides dark/light mode theme switching
 * Persists theme preference to localStorage
 * Supports system theme detection
 *
 * @module ThemeProvider
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
 theme: Theme;
 setTheme: (_theme: Theme) => void;
 resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
 const [theme, setThemeState] = useState<Theme>('system');
 const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

 // Load theme from localStorage on mount
 useEffect(() => {
 const stored = localStorage.getItem('theme') as Theme | null;
 if (stored && ['dark', 'light', 'system'].includes(stored)) {
 setThemeState(stored);
 }
 }, []);

 // Resolve system theme
 useEffect(() => {
 const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

 const updateResolvedTheme = () => {
 if (theme === 'system') {
 setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
 } else {
 setResolvedTheme(theme);
 }
 };

 updateResolvedTheme();

 // Listen for system theme changes
 mediaQuery.addEventListener('change', updateResolvedTheme);
 return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
 }, [theme]);

 // Apply theme to document
 useEffect(() => {
 const root = document.documentElement;
 root.classList.remove('light', 'dark');
 root.classList.add(resolvedTheme);
 }, [resolvedTheme]);

 const setTheme = (newTheme: Theme) => {
 setThemeState(newTheme);
 localStorage.setItem('theme', newTheme);
 };

 return (
 <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
 {children}
 </ThemeContext.Provider>
 );
}

export function useTheme() {
 const context = useContext(ThemeContext);
 if (!context) {
 throw new Error('useTheme must be used within ThemeProvider');
 }
 return context;
}
