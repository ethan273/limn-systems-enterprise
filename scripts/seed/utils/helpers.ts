/**
 * Seeding Helper Utilities
 *
 * Common helper functions for database seeding
 */

import { faker } from '@faker-js/faker';

// Counters for sequential numbering
export let orderCounter = 1;
export let productionOrderCounter = 1;
export let shipmentCounter = 1;
export let invoiceCounter = 1;
export let shopDrawingCounter = 1;

export function resetCounters() {
  orderCounter = 1;
  productionOrderCounter = 1;
  shipmentCounter = 1;
  invoiceCounter = 1;
  shopDrawingCounter = 1;
}

export function incrementOrderCounter() {
  return orderCounter++;
}

export function incrementProductionOrderCounter() {
  return productionOrderCounter++;
}

export function incrementShipmentCounter() {
  return shipmentCounter++;
}

export function incrementInvoiceCounter() {
  return invoiceCounter++;
}

export function incrementShopDrawingCounter() {
  return shopDrawingCounter++;
}

/**
 * Generate realistic order number
 */
export function generateOrderNumber(): string {
  return `ORD-2025-${String(incrementOrderCounter()).padStart(3, '0')}`;
}

/**
 * Generate realistic production order number
 */
export function generateProductionOrderNumber(): string {
  return `PRD-2025-${String(incrementProductionOrderCounter()).padStart(3, '0')}`;
}

/**
 * Generate realistic shipment number
 */
export function generateShipmentNumber(): string {
  return `SHP-2025-${String(incrementShipmentCounter()).padStart(3, '0')}`;
}

/**
 * Generate realistic invoice number
 */
export function generateInvoiceNumber(): string {
  return `INV-2025-${String(incrementInvoiceCounter()).padStart(3, '0')}`;
}

/**
 * Generate realistic shop drawing number
 */
export function generateShopDrawingNumber(): string {
  return `SD-${String(incrementShopDrawingCounter()).padStart(3, '0')}`;
}

/**
 * Generate realistic tracking number
 */
export function generateTrackingNumber(): string {
  return faker.string.alphanumeric(12).toUpperCase();
}

/**
 * Random element from array
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Random elements from array (multiple)
 */
export function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random boolean with probability
 */
export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Random date in the past
 */
export function randomPastDate(months: number = 6): Date {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(now.getMonth() - months);
  return faker.date.between({ from: past, to: now });
}

/**
 * Random future date
 */
export function randomFutureDate(months: number = 3): Date {
  const now = new Date();
  const future = new Date(now);
  future.setMonth(now.getMonth() + months);
  return faker.date.between({ from: now, to: future });
}

/**
 * Random date between two dates
 */
export function randomDateBetween(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end });
}

/**
 * Weighted random selection
 * @param options Array of [value, weight] pairs
 */
export function weightedRandom<T>(options: Array<[T, number]>): T {
  const totalWeight = options.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [value, weight] of options) {
    if (random < weight) return value;
    random -= weight;
  }

  return options[options.length - 1][0];
}

/**
 * Status distribution helpers
 */
export const STATUS_DISTRIBUTIONS = {
  // Lead statuses - weighted toward active pipeline
  lead: {
    new: 0.15,
    contacted: 0.20,
    qualified: 0.25,
    proposal: 0.15,
    negotiation: 0.10,
    won: 0.10,
    lost: 0.05,
  },

  // Order statuses - weighted toward in-progress
  order: {
    draft: 0.10,
    pending: 0.15,
    confirmed: 0.30,
    in_production: 0.25,
    shipped: 0.15,
    delivered: 0.05,
  },

  // Production statuses
  production: {
    pending: 0.15,
    in_progress: 0.40,
    quality_check: 0.20,
    completed: 0.20,
    shipped: 0.05,
  },

  // Shipment statuses
  shipment: {
    pending: 0.10,
    preparing: 0.15,
    ready: 0.10,
    shipped: 0.20,
    in_transit: 0.25,
    delivered: 0.15,
    delayed: 0.05,
  },

  // Task statuses
  task: {
    todo: 0.35,
    in_progress: 0.40,
    completed: 0.20,
    cancelled: 0.05,
  },

  // Priority distribution
  priority: {
    low: 0.30,
    medium: 0.50,
    high: 0.15,
    urgent: 0.05,
  },
};

/**
 * Get random status based on distribution
 */
export function getRandomStatus(type: keyof typeof STATUS_DISTRIBUTIONS): string {
  const distribution = STATUS_DISTRIBUTIONS[type];
  const options = Object.entries(distribution).map(([status, weight]) => [status, weight] as [string, number]);
  return weightedRandom(options);
}

/**
 * Prospect temperature distribution
 */
export function getRandomProspectStatus(): 'hot' | 'warm' | 'cold' {
  return weightedRandom<'hot' | 'warm' | 'cold'>([
    ['hot', 0.25],
    ['warm', 0.50],
    ['cold', 0.25],
  ]);
}

/**
 * Customer type distribution
 */
export function getRandomCustomerType(): 'residential' | 'commercial' | 'hospitality' | 'designer' {
  return weightedRandom<'residential' | 'commercial' | 'hospitality' | 'designer'>([
    ['residential', 0.30],
    ['commercial', 0.25],
    ['hospitality', 0.20],
    ['designer', 0.25],
  ]);
}

/**
 * Shipping carrier distribution
 */
export function getRandomCarrier(): string {
  return randomElement(['FedEx', 'UPS', 'DHL', 'Freight Carrier', 'Local Delivery']);
}

/**
 * Payment method distribution
 */
export function getRandomPaymentMethod(): string {
  return weightedRandom([
    ['wire_transfer', 0.40],
    ['credit_card', 0.30],
    ['check', 0.20],
    ['ACH', 0.10],
  ]);
}

/**
 * Generate realistic company name
 */
export function generateCompanyName(): string {
  const types = [
    () => `${faker.company.name()}`,
    () => `${faker.location.city()} ${faker.company.buzzNoun()} Co.`,
    () => `${faker.person.lastName()} ${randomElement(['Group', 'Enterprises', 'Holdings', 'LLC'])}`,
    () => `${randomElement(['Modern', 'Classic', 'Urban', 'Coastal', 'Mountain'])} ${randomElement(['Interiors', 'Design', 'Living', 'Spaces'])}`,
  ];

  return randomElement(types)();
}

/**
 * Generate realistic project name
 */
export function generateProjectName(): string {
  const types = [
    () => `${faker.location.city()} ${randomElement(['Residence', 'Estate', 'Penthouse', 'Villa'])}`,
    () => `${faker.location.street()} ${randomElement(['Renovation', 'Build', 'Remodel'])}`,
    () => `${faker.company.name()} ${randomElement(['Office', 'Headquarters', 'Lobby', 'Suite'])}`,
    () => `${randomElement(['Grand', 'Luxury', 'Boutique', 'Historic'])} ${randomElement(['Hotel', 'Resort', 'Club', 'Restaurant'])} - ${faker.location.city()}`,
  ];

  return randomElement(types)();
}

/**
 * Generate realistic phone number
 */
export function generatePhoneNumber(): string {
  return faker.phone.number('###-###-####');
}

/**
 * Generate realistic address
 */
export function generateAddress() {
  return {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: 'USA',
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Log seeding progress
 */
export function logProgress(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

/**
 * Log error with context
 */
export function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error);
}

/**
 * Log success
 */
export function logSuccess(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ ${message}`);
}
