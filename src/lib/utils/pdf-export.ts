import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPDFOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: number;
}

/**
 * Export a dashboard or component to PDF
 * @param elementId - The ID of the element to export
 * @param options - Export options
 */
export async function exportToPDF(
  elementId: string,
  options: ExportPDFOptions = {}
): Promise<void> {
  const {
    filename = 'dashboard-export.pdf',
    title,
    orientation = 'landscape',
    quality = 0.95,
  } = options;

  try {
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions
    const imgWidth = orientation === 'landscape' ? 297 : 210; // A4 in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    // Add title if provided
    if (title) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 14, 15);
    }

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality);

    // Add image to PDF
    const yPosition = title ? 25 : 10;
    pdf.addImage(imgData, 'JPEG', 10, yPosition, imgWidth - 20, imgHeight);

    // Check if content exceeds one page
    if (imgHeight > (orientation === 'landscape' ? 190 : 277)) {
      // Content spans multiple pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 10, position + yPosition, imgWidth - 20, imgHeight);
      heightLeft -= (orientation === 'landscape' ? 190 : 277);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position + yPosition, imgWidth - 20, imgHeight);
        heightLeft -= (orientation === 'landscape' ? 190 : 277);
      }
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

/**
 * Export dashboard with metadata
 */
export async function exportDashboardToPDF(
  dashboardName: string,
  dateRange: string
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${dashboardName.toLowerCase().replace(/\s+/g, '-')}-${dateRange}-${timestamp}.pdf`;

  await exportToPDF('dashboard-export-container', {
    filename,
    title: `${dashboardName} - ${dateRange}`,
    orientation: 'landscape',
  });
}
