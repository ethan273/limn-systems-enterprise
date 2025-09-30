import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (_email: string, _password?: string) => Promise<void>;
  signInWithMagicLink: (_email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signOut = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('access_token');

      if (accessToken) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      router.push('/auth/signin');
    }
  }, [router]);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { accessToken, user: userData } = await response.json();
        localStorage.setItem('access_token', accessToken);
        setUser(userData);
      } else {
        signOut();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      signOut();
    }
  }, [signOut]);

  const checkAuth = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  const signIn = async (email: string, password?: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        method: 'password',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }

    const { accessToken, refreshToken, user: userData } = await response.json();
    
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(userData);
    
    router.push('/dashboard');
  };

  const signInWithMagicLink = async (email: string) => {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send magic link');
    }
  };

  const signInWithGoogle = async () => {
    window.location.href = '/api/auth/google';
  };

  useEffect(() => {
    checkAuth();
    const interval = setInterval(refreshToken, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAuth, refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR/build time, return a default context instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null,
        loading: true,
        error: null,
        signIn: async () => ({ error: 'SSR context' }),
        signOut: async () => {},
        signUp: async () => ({ error: 'SSR context' }),
        resetPassword: async () => ({ error: 'SSR context' }),
        updateProfile: async () => ({ error: 'SSR context' }),
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}