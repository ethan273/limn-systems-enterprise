/**
 * Web Share Target Handler
 *
 * Handles shared content from other apps via Web Share Target API
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SharedData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

function ShareTargetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sharedData, setSharedData] = useState<SharedData>({});
  const [uploading, setUploading] = useState(false);
  const [route, setRoute] = useState<string>('/dashboard');

  useEffect(() => {
    // Get shared data from URL parameters
    const title = searchParams.get('title') || '';
    const text = searchParams.get('text') || '';
    const url = searchParams.get('url') || '';

    setSharedData({ title, text, url });

    // Determine appropriate route based on shared content
    const destination = determineRoute({ title, text, url });
    setRoute(destination);
  }, [searchParams]);

  /**
   * Determine which route to navigate to based on shared content
   */
  const determineRoute = (data: SharedData): string => {
    const { title, text, url } = data;
    const content = `${title} ${text} ${url}`.toLowerCase();

    // Check for keywords to route appropriately
    if (content.includes('task') || content.includes('todo')) {
      return '/tasks/new';
    } else if (content.includes('order') || content.includes('purchase')) {
      return '/orders/new';
    } else if (content.includes('note') || content.includes('memo')) {
      return '/notes/new';
    } else if (content.includes('contact') || content.includes('client')) {
      return '/crm/contacts/new';
    } else if (url && !text && !title) {
      // Just a URL share - create a note with the link
      return '/notes/new';
    } else {
      // Default to documents
      return '/documents/upload';
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    setUploading(true);

    try {
      // Store shared data in session storage for the target page
      sessionStorage.setItem('sharedData', JSON.stringify(sharedData));

      // Navigate to the appropriate page
      router.push(route);
    } catch (error) {
      console.error('[Share] Error handling shared content:', error);
      setUploading(false);
    }
  };

  /**
   * Get icon based on shared content type
   */
  const getContentIcon = () => {
    if (sharedData.url && !sharedData.text) {
      return <LinkIcon className="h-12 w-12" />;
    } else if (sharedData.files && sharedData.files.length > 0) {
      return <ImageIcon className="h-12 w-12" />;
    } else {
      return <FileText className="h-12 w-12" />;
    }
  };

  /**
   * Get content type label
   */
  const getContentType = () => {
    if (sharedData.url && !sharedData.text) {
      return 'Link';
    } else if (sharedData.files && sharedData.files.length > 0) {
      return 'Files';
    } else {
      return 'Text';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Shared Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Preview */}
          <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/50">
            <div className="text-muted-foreground">
              {getContentIcon()}
            </div>

            <div className="text-center w-full">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Shared {getContentType()}
              </div>

              {sharedData.title && (
                <h3 className="text-lg font-semibold mb-2">{sharedData.title}</h3>
              )}

              {sharedData.text && (
                <p className="text-sm text-muted-foreground mb-2">{sharedData.text}</p>
              )}

              {sharedData.url && (
                <a
                  href={sharedData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {sharedData.url}
                </a>
              )}

              {sharedData.files && sharedData.files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    {sharedData.files.length} file(s) shared
                  </p>
                  <ul className="text-sm text-muted-foreground">
                    {sharedData.files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Destination Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Where would you like to save this?
              </label>
              <select
                className="input-field w-full"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
              >
                <option value="/tasks/new">📋 New Task</option>
                <option value="/notes/new">📝 New Note</option>
                <option value="/documents/upload">📄 Upload Document</option>
                <option value="/orders/new">🛒 New Order</option>
                <option value="/crm/contacts/new">👤 New Contact</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Continue
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Shared content will be pre-filled in the selected form for easy saving.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ShareTargetContent />
    </Suspense>
  );
}
