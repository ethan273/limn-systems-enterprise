import { Suspense } from "react";
import { ShareLinkViewer } from "./ShareLinkViewer";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShareLinkPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading flipbook...</p>
          </div>
        </div>
      }
    >
      <ShareLinkViewer token={resolvedParams.token} searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
