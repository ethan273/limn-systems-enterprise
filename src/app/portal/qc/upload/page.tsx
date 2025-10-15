'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Unused: import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

/**
 * QC Portal Upload Reports
 * Upload quality inspection reports and documentation
 */
export default function QCUploadPage() {
  const _router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      // Upload files to Supabase Storage
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      for (const file of Array.from(files)) {
        // Generate unique file path: qc-reports/{userId}/{timestamp}-{filename}
        const timestamp = Date.now();
        const filePath = `qc-reports/${timestamp}-${file.name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        console.log('File uploaded successfully:', data);
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Upload Reports</h1>
        <p className="page-subtitle">Upload quality inspection reports and documentation</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Inspection Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                  </p>
                </div>
                <Button type="button" variant="outline" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Select Files'}
                </Button>
              </label>
            </div>

            {/* Success Message */}
            {uploadSuccess && (
              <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Upload successful!</p>
                  <p className="text-sm text-muted-foreground">
                    Your report has been uploaded successfully.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Guidelines */}
            <div className="space-y-3">
              <h3 className="font-semibold">Upload Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Ensure all inspection details are clearly documented</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Include photos of any defects or issues found</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Use descriptive file names (e.g., &quot;Project-Name-QC-Report-2024-01-15.pdf&quot;)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Maximum file size: 10MB per file</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Accepted formats: PDF, DOC, DOCX, JPG, PNG</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">No recent uploads</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your uploaded reports will appear here
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you&apos;re having trouble uploading reports or have questions about the inspection process,
            please contact your administrator.
          </p>
          <Button variant="outline">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
