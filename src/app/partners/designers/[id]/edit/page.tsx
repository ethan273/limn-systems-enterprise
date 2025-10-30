'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState, Breadcrumb } from '@/components/common';

interface DesignerEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Designer Edit Page
 * Redirects to the detail page which has inline editing capabilities
 */
export default function DesignerEditPage({ params }: DesignerEditPageProps) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to detail page where inline editing is available
    router.replace(`/partners/designers/${id}`);
  }, [id, router]);

  return (
    <div className="page-container">
      <Breadcrumb />
      <LoadingState message="Redirecting to designer details..." size="lg" />
    </div>
  );
}
