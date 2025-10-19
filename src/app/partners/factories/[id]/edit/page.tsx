'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/common/LoadingState';

interface FactoryEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Factory Edit Page
 * Redirects to the detail page which has inline editing capabilities
 */
export default function FactoryEditPage({ params }: FactoryEditPageProps) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to detail page where inline editing is available
    router.replace(`/partners/factories/${id}`);
  }, [id, router]);

  return (
    <div className="page-container">
      <LoadingState message="Redirecting to factory details..." size="lg" />
    </div>
  );
}
