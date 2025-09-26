import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = '/auth/signin',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath);
      } else if (requiredRole && !requiredRole.includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredRole, router, fallbackPath]);

  if (loading) {
    return (      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}