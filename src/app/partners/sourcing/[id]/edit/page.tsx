'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState, Breadcrumb } from '@/components/common';

interface SourcingEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Sourcing Edit Page
 * Redirects to the detail page which has inline editing capabilities
 */
export default function SourcingEditPage({ params }: SourcingEditPageProps) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to detail page where inline editing is available
    router.replace(`/partners/sourcing/${id}`);
  }, [id, router]);

  return (
    <div className="page-container">
      <Breadcrumb />
      <LoadingState message="Redirecting to sourcing details..." size="lg" />
    </div>
  );
}
