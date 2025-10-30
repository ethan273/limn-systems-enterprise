"use client";
import { log } from '@/lib/logger';

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as fabric from "fabric";

interface DocumentUploadDialogProps {
  _open: boolean;
  onOpenChange: (_open: boolean) => void;
  canvas: fabric.Canvas | null;
  onDocumentAdded?: () => void;
}

const SUPPORTED_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.ms-powerpoint': 'PPT',
  'text/plain': 'TXT',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
};

export function DocumentUploadDialog({ _open: open, onOpenChange, canvas, onDocumentAdded }: DocumentUploadDialogProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    // Check file type
    if (!Object.keys(SUPPORTED_TYPES).includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}`);
      e.target.value = ''; // Reset input
      return;
    }

    setUploading(true);
    toast.info('Processing file...');

    try {
      const fileType = SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES];

      // Handle images
      if (file.type.startsWith('image/')) {
        await handleImageUpload(file, canvas);
      }
      // Handle PDFs
      else if (file.type === 'application/pdf') {
        await handlePDFUpload(file, canvas);
      }
      // Handle Word documents
      else if (file.type.includes('word')) {
        await handleWordUpload(file, canvas);
      }
      // Handle Excel documents
      else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
        await handleExcelUpload(file, canvas);
      }
      // Handle PowerPoint
      else if (file.type.includes('presentation')) {
        await handlePowerPointUpload(file, canvas);
      }
      // Handle text files
      else if (file.type === 'text/plain') {
        await handleTextUpload(file, canvas);
      }

      toast.success(`${fileType} uploaded successfully`);
      onDocumentAdded?.();
      e.target.value = ''; // Reset input
      onOpenChange(false);
    } catch (error) {
      log.error('Upload error:', { error });
      toast.error(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
      e.target.value = ''; // Reset input
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (file: File, canvas: fabric.Canvas) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        fabric.FabricImage.fromURL(imgUrl).then((img) => {
          const maxSize = 600;
          const scale = Math.min(
            maxSize / img.width!,
            maxSize / img.height!,
            1
          );

          img.set({
            left: canvas.width! / 2 - (img.width! * scale) / 2,
            top: canvas.height! / 2 - (img.height! * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          resolve();
        }).catch(reject);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePDFUpload = async (file: File, canvas: fabric.Canvas) => {
    try {
      log.info('Starting PDF upload...');

      // Use shared PDF processing utility
      const { renderPdfFirstPage } = await import('@/lib/pdf/client-processor');
      log.info('PDF processor loaded');

      log.info('Rendering first page...');
      const result = await renderPdfFirstPage(file, { scale: 1.5, format: 'png' });

      // Convert to Fabric image
      const imgUrl = result.dataUrl;
      log.info('Creating Fabric image...');
      const img = await fabric.FabricImage.fromURL(imgUrl);
      log.info('Fabric image created');

      // Get page count for display
      const { getPdfMetadata } = await import('@/lib/pdf/client-processor');
      const metadata = await getPdfMetadata(file);
      const numPages = metadata.numPages;

      const maxSize = 600;
      const scale = Math.min(
        maxSize / img.width!,
        maxSize / img.height!,
        1
      );

      img.set({
        left: canvas.width! / 2 - (img.width! * scale) / 2,
        top: canvas.height! / 2 - (img.height! * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });

      // Add PDF info
      const text = new fabric.IText(`PDF: ${file.name}\nPage 1 of ${numPages}`, {
        left: img.left,
        top: (img.top || 0) - 40,
        fontSize: 14,
        fill: '#333',
      });

      const group = new fabric.Group([img, text], {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      log.info('PDF added to canvas successfully');
    } catch (error) {
      log.error('PDF upload error:', { error });
      throw error;
    }
  };

  const handleWordUpload = async (file: File, canvas: fabric.Canvas) => {
    try {
      log.info('Starting Word upload...');
      const arrayBuffer = await file.arrayBuffer();

      log.info('Loading mammoth...');
      const mammoth = await import('mammoth');
      log.info('Mammoth loaded');

      log.info('Converting Word to HTML...');
      const result = await mammoth.convertToHtml({ arrayBuffer });
      log.info('Conversion complete');
      const html = result.value;

      // Create a text box with the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || '';

      log.info('Extracted text length:', text.length);

      const textBox = new fabric.Textbox(text.substring(0, 500) + (text.length > 500 ? '...' : ''), {
        left: canvas.width! / 2 - 250,
        top: canvas.height! / 2 - 200,
        width: 500,
        fontSize: 14,
        fill: '#333',
      });

      // Add file name label
      const label = new fabric.IText(`Word Document: ${file.name}`, {
        left: textBox.left,
        top: (textBox.top || 0) - 30,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#2563eb',
      });

      const rect = new fabric.Rect({
        left: (textBox.left || 0) - 10,
        top: (textBox.top || 0) - 40,
        width: 520,
        height: 440,
        fill: 'white',
        stroke: '#e5e7eb',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      });

      const group = new fabric.Group([rect, label, textBox], {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      log.info('Word document added to canvas successfully');
    } catch (error) {
      log.error('Word upload error:', { error });
      throw error;
    }
  };

  const handleExcelUpload = async (file: File, canvas: fabric.Canvas) => {
    const arrayBuffer = await file.arrayBuffer();
    const ExcelJS = await import('exceljs');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const firstSheet = workbook.worksheets[0]!;
    const sheetName = firstSheet.name;

    // Convert to 2D array (same format as before)
    const data: any[][] = [];
    firstSheet.eachRow((row, _rowNumber) => {
      const rowData: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, _colNumber) => {
        rowData.push(cell.value);
      });
      data.push(rowData);
    });

    // Create a table-like representation
    let tableText = `Excel: ${file.name}\nSheet: ${sheetName}\n\n`;

    // Add headers and first few rows
    const rowsToShow = Math.min(10, data.length);
    for (let i = 0; i < rowsToShow; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const row = data[i] || []; // Safe: i is bounds-checked loop index
      tableText += row.slice(0, 5).map(cell => String(cell || '').padEnd(15)).join(' | ') + '\n';
    }

    if (data.length > rowsToShow) {
      tableText += `\n... and ${data.length - rowsToShow} more rows`;
    }

    const textBox = new fabric.Textbox(tableText, {
      left: canvas.width! / 2 - 300,
      top: canvas.height! / 2 - 200,
      width: 600,
      fontSize: 12,
      fontFamily: 'monospace',
      fill: '#333',
    });

    const rect = new fabric.Rect({
      left: (textBox.left || 0) - 10,
      top: (textBox.top || 0) - 10,
      width: 620,
      height: 420,
      fill: '#f0fdf4',
      stroke: '#10b981',
      strokeWidth: 2,
      rx: 8,
      ry: 8,
    });

    const group = new fabric.Group([rect, textBox], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
  };

  const handlePowerPointUpload = async (file: File, canvas: fabric.Canvas) => {
    // PowerPoint files are complex - for now, show a placeholder
    const placeholder = new fabric.Rect({
      left: canvas.width! / 2 - 250,
      top: canvas.height! / 2 - 150,
      width: 500,
      height: 300,
      fill: '#fff7ed',
      stroke: '#f97316',
      strokeWidth: 3,
      rx: 12,
      ry: 12,
    });

    const text = new fabric.IText(`PowerPoint: ${file.name}\n\n📊 Presentation file uploaded\n\nNote: Full PowerPoint rendering\ncoming soon. For now, this is\na placeholder.`, {
      left: canvas.width! / 2 - 200,
      top: canvas.height! / 2 - 100,
      fontSize: 16,
      fill: '#ea580c',
      textAlign: 'center',
    });

    const group = new fabric.Group([placeholder, text], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
  };

  const handleTextUpload = async (file: File, canvas: fabric.Canvas) => {
    const text = await file.text();

    const textBox = new fabric.Textbox(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''), {
      left: canvas.width! / 2 - 300,
      top: canvas.height! / 2 - 200,
      width: 600,
      fontSize: 14,
      fontFamily: 'monospace',
      fill: '#1f2937',
    });

    const label = new fabric.IText(`Text File: ${file.name}`, {
      left: textBox.left,
      top: (textBox.top || 0) - 30,
      fontSize: 16,
      fontWeight: 'bold',
      fill: '#4b5563',
    });

    const rect = new fabric.Rect({
      left: (textBox.left || 0) - 10,
      top: (textBox.top || 0) - 40,
      width: 620,
      height: 440,
      fill: '#f9fafb',
      stroke: '#6b7280',
      strokeWidth: 1,
      rx: 8,
      ry: 8,
    });

    const group = new fabric.Group([rect, label, textBox], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload PDF, Word, Excel, PowerPoint, text files, or images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              type="file"
              id="document-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.svg"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label
              htmlFor="document-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, or images
                </p>
              </div>
            </label>
          </div>

          {/* Supported Formats */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs font-medium mb-2">Supported formats:</p>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>📄 PDF</div>
              <div>📝 Word</div>
              <div>📊 Excel</div>
              <div>📈 PowerPoint</div>
              <div>📋 Text</div>
              <div>🖼️ Images</div>
              <div>🎨 SVG</div>
              <div>📁 More...</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
