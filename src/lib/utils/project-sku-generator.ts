/**
 * Project SKU Generator Utility
 *
 * Generates unique project-based SKUs for order tracking following the format:
 * {CLIENT_CODE}-{YY}-{PROJECT_CODE}-{ORDER_NUM}.{ITEM_NUM}
 *
 * Examples:
 * - ACME-24-DEV-001.001 (ACME Corp, 2024, Development Center, Order 1, Item 1)
 * - SMITH-25-HOME-002.003 (Smith Family, 2025, Home Office, Order 2, Item 3)
 */

import { prisma } from "@/lib/prisma";

/**
 * Generate client code from client name
 * Takes first word or company name and converts to uppercase
 *
 * @param clientName Full client name (e.g., "John Smith" or "ACME Corporation")
 * @returns Client code (e.g., "SMITH" or "ACME")
 */
function generateClientCode(clientName: string): string {
  if (!clientName || typeof clientName !== 'string') {
    return 'UNKNOWN';
  }

  // Remove common suffixes
  const cleaned = clientName
    .replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Limited|Co|Company)\b/gi, '')
    .trim();

  // Take first word or last word (for names like "John Smith")
  const words = cleaned.split(/\s+/);

  if (words.length === 0) {
    return clientName.substring(0, 6).toUpperCase();
  }

  // If multiple words, prefer last word (surname for people, or first word for companies)
  const code = words.length > 1 ? words[words.length - 1] : words[0];

  return code.substring(0, 6).toUpperCase();
}

/**
 * Generate project code from project name
 * Takes first 4 letters of first word
 *
 * @param projectName Project name (e.g., "Home Office Renovation")
 * @returns Project code (e.g., "HOME")
 */
function generateProjectCode(projectName: string | null | undefined): string {
  if (!projectName || typeof projectName !== 'string') {
    return 'PROJ';
  }

  const firstWord = projectName.trim().split(/\s+/)[0] || 'PROJ';
  return firstWord.substring(0, 4).toUpperCase();
}

/**
 * Get next order number for a client/project combination
 *
 * @param clientCode Client code
 * @param projectCode Project code
 * @param year 2-digit year
 * @returns Next sequential order number
 */
async function getNextOrderNumber(
  clientCode: string,
  projectCode: string,
  year: string
): Promise<number> {
  // Find all existing project SKUs matching this client/project/year pattern
  const prefix = `${clientCode}-${year}-${projectCode}-`;

  const existingOrderItems = await prisma.order_items.findMany({
    where: {
      project_sku: {
        startsWith: prefix,
      },
    },
    select: {
      project_sku: true,
    },
    orderBy: {
      project_sku: 'desc',
    },
    take: 1,
  });

  if (existingOrderItems.length === 0) {
    return 1;
  }

  // Extract order number from last SKU
  const lastSku = existingOrderItems[0]!.project_sku;
  if (!lastSku) return 1;

  // Format: CLIENT-YY-PROJ-###.###
  const parts = lastSku.split('-');
  if (parts.length < 4) return 1;

  const orderPart = parts[3]?.split('.')[0];
  if (!orderPart) return 1;

  const lastOrderNum = parseInt(orderPart, 10);
  if (isNaN(lastOrderNum)) return 1;

  return lastOrderNum + 1;
}

/**
 * Get next line item number for an order
 *
 * @param clientCode Client code
 * @param projectCode Project code
 * @param year 2-digit year
 * @param orderNumber Order number
 * @returns Next sequential line item number
 */
async function getNextLineItemNumber(
  clientCode: string,
  projectCode: string,
  year: string,
  orderNumber: number
): Promise<number> {
  // Find all existing line items for this order
  const orderPrefix = `${clientCode}-${year}-${projectCode}-${orderNumber.toString().padStart(3, '0')}.`;

  const existingItems = await prisma.order_items.findMany({
    where: {
      project_sku: {
        startsWith: orderPrefix,
      },
    },
    select: {
      project_sku: true,
    },
    orderBy: {
      project_sku: 'desc',
    },
    take: 1,
  });

  if (existingItems.length === 0) {
    return 1;
  }

  // Extract line item number from last SKU
  const lastSku = existingItems[0]!.project_sku;
  if (!lastSku) return 1;

  const itemPart = lastSku.split('.')[1];
  if (!itemPart) return 1;

  const lastItemNum = parseInt(itemPart, 10);
  if (isNaN(lastItemNum)) return 1;

  return lastItemNum + 1;
}

/**
 * Generate project SKU for order item tracking
 *
 * Format: {CLIENT_CODE}-{YY}-{PROJECT_CODE}-{ORDER_NUM}.{ITEM_NUM}
 *
 * @param clientName Client/customer name
 * @param projectName Project name (optional)
 * @param orderId Order ID (for grouping items in same order)
 * @returns Project SKU (e.g., "ACME-24-DEV-001.001")
 */
export async function generateProjectSku(
  clientName: string,
  projectName: string | null | undefined,
  orderId: string
): Promise<string> {
  if (!clientName) {
    throw new Error('Client name is required to generate Project SKU');
  }

  if (!orderId) {
    throw new Error('Order ID is required to generate Project SKU');
  }

  // Generate codes
  const clientCode = generateClientCode(clientName);
  const projectCode = generateProjectCode(projectName);
  const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits

  // Get next order number for this client/project/year
  const orderNumber = await getNextOrderNumber(clientCode, projectCode, year);

  // Get next line item number for this order
  const itemNumber = await getNextLineItemNumber(clientCode, projectCode, year, orderNumber);

  // Format order and item numbers with leading zeros
  const orderStr = orderNumber.toString().padStart(3, '0');
  const itemStr = itemNumber.toString().padStart(3, '0');

  // Assemble project SKU
  return `${clientCode}-${year}-${projectCode}-${orderStr}.${itemStr}`;
}

/**
 * Generate project SKU for a specific line item number within an order
 *
 * @param clientName Client/customer name
 * @param projectName Project name (optional)
 * @param orderId Order ID
 * @param lineItemNumber Specific line item number (e.g., 1, 2, 3...)
 * @returns Project SKU with specified line item number
 */
export async function generateProjectSkuForLineItem(
  clientName: string,
  projectName: string | null | undefined,
  orderId: string,
  lineItemNumber: number
): Promise<string> {
  if (!clientName) {
    throw new Error('Client name is required to generate Project SKU');
  }

  if (!orderId) {
    throw new Error('Order ID is required to generate Project SKU');
  }

  // Generate codes
  const clientCode = generateClientCode(clientName);
  const projectCode = generateProjectCode(projectName);
  const year = new Date().getFullYear().toString().slice(-2);

  // Get next order number
  const orderNumber = await getNextOrderNumber(clientCode, projectCode, year);

  // Format with specified line item number
  const orderStr = orderNumber.toString().padStart(3, '0');
  const itemStr = lineItemNumber.toString().padStart(3, '0');

  return `${clientCode}-${year}-${projectCode}-${orderStr}.${itemStr}`;
}

/**
 * Validate project SKU format
 *
 * @param sku Project SKU to validate
 * @returns True if valid, false otherwise
 */
export function isValidProjectSku(sku: string): boolean {
  if (!sku || typeof sku !== 'string') return false;

  // Format: CLIENT-YY-PROJ-###.###
  const pattern = /^[A-Z]+-\d{2}-[A-Z]+-\d{3}\.\d{3}$/;
  return pattern.test(sku);
}

/**
 * Parse project SKU into components
 *
 * @param sku Project SKU
 * @returns Parsed components or null if invalid
 */
export function parseProjectSku(sku: string): {
  clientCode: string;
  year: string;
  projectCode: string;
  orderNumber: number;
  lineItemNumber: number;
} | null {
  if (!isValidProjectSku(sku)) return null;

  const [clientCode, year, projectCode, orderPart] = sku.split('-');
  const [orderStr, itemStr] = orderPart!.split('.');

  return {
    clientCode: clientCode!,
    year: year!,
    projectCode: projectCode!,
    orderNumber: parseInt(orderStr!, 10),
    lineItemNumber: parseInt(itemStr!, 10),
  };
}
