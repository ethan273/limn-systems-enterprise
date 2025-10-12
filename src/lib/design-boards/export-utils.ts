import * as fabric from "fabric";

export interface ExportOptions {
  format: 'png' | 'svg' | 'json';
  quality?: number; // For PNG, 0-1
  multiplier?: number; // Scale factor
  width?: number;
  height?: number;
}

/**
 * Export canvas to PNG
 */
export function exportToPNG(
  canvas: fabric.Canvas,
  filename: string = 'design-board.png',
  options: Partial<ExportOptions> = {}
): void {
  const { quality = 1, multiplier = 2 } = options;

  // Create a data URL
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality,
    multiplier, // Higher multiplier = higher resolution
  });

  // Create a download link
  downloadDataURL(dataURL, filename);
}

/**
 * Export canvas to SVG
 */
export function exportToSVG(
  canvas: fabric.Canvas,
  filename: string = 'design-board.svg'
): void {
  // Convert canvas to SVG string
  const svgString = canvas.toSVG();

  // Create a blob and download
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * Export canvas to JSON (for saving/loading)
 */
export function exportToJSON(
  canvas: fabric.Canvas,
  filename: string = 'design-board.json'
): void {
  const json = JSON.stringify(canvas.toJSON(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * Helper function to download a data URL
 */
function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper function to download a URL
 */
function downloadURL(url: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export with custom dimensions
 */
export function exportWithDimensions(
  canvas: fabric.Canvas,
  width: number,
  height: number,
  format: 'png' | 'svg' = 'png',
  filename?: string
): void {
  // Calculate multiplier based on desired dimensions
  const currentWidth = canvas.getWidth();
  const currentHeight = canvas.getHeight();
  const multiplier = Math.min(width / currentWidth, height / currentHeight);

  if (format === 'png') {
    exportToPNG(canvas, filename, { multiplier });
  } else {
    exportToSVG(canvas, filename);
  }
}

/**
 * Export only selected objects
 */
export function exportSelection(
  canvas: fabric.Canvas,
  format: 'png' | 'svg' = 'png',
  filename?: string
): void {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  // Create a temporary canvas with just the selection
  const tempCanvas = new fabric.Canvas(document.createElement('canvas'));

  // Clone the active object
  activeObject.clone((cloned: fabric.Object) => {
    const bounds = cloned.getBoundingRect();

    // Set canvas size to fit the selection
    tempCanvas.setDimensions({
      width: bounds.width + 40, // Add padding
      height: bounds.height + 40,
    });

    // Center the object
    cloned.set({
      left: 20,
      top: 20,
    });

    tempCanvas.add(cloned);
    tempCanvas.renderAll();

    // Export the temp canvas
    if (format === 'png') {
      exportToPNG(tempCanvas, filename || 'selection.png');
    } else {
      exportToSVG(tempCanvas, filename || 'selection.svg');
    }

    // Clean up
    tempCanvas.dispose();
  });
}
