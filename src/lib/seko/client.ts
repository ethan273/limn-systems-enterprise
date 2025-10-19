/**
 * SEKO Shipping API Client
 *
 * Provides integration with SEKO's shipping API for:
 * - Getting shipping quotes from multiple carriers
 * - Creating shipments
 * - Tracking shipments
 * - Generating shipping labels (PDF/ZPL)
 *
 * Documentation: https://api.seko.com/docs
 */

// Environment variables for SEKO API
// CRITICAL: Do NOT use hardcoded fallbacks - forces proper environment configuration
const SEKO_API_KEY = process.env.SEKO_API_KEY || "";
const SEKO_API_SECRET = process.env.SEKO_API_SECRET || "";
const SEKO_PROFILE_ID = process.env.NEXT_PUBLIC_SEKO_PROFILE_ID || "";
const SEKO_BASE_URL = process.env.NEXT_PUBLIC_SEKO_BASE_URL || "";

// ============================================================================
// TYPES
// ============================================================================

export interface SekoCredentials {
  apiKey: string;
  apiSecret: string;
  profileId: string;
  baseUrl: string;
}

export interface Address {
  name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Package {
  length: number; // inches
  width: number; // inches
  height: number; // inches
  weight: number; // lbs
  quantity?: number;
}

export interface QuoteRequest {
  origin: Address;
  destination: Address;
  packages: Package[];
  ship_date?: Date;
}

export interface ShippingQuote {
  carrier: string;
  service_level: string;
  service_name: string;
  estimated_days: number;
  total_charge: number;
  currency: string;
  delivery_date?: Date;
  carrier_account_id?: string;
}

export interface ShipmentRequest {
  order_id: string; // production_order_id or sales order id
  origin: Address;
  destination: Address;
  packages: Package[];
  carrier: string;
  service_level: string;
  carrier_account_id?: string;
  ship_date?: Date;
  reference_number?: string;
  special_instructions?: string;
}

export interface ShipmentResponse {
  shipment_id: string;
  tracking_number: string;
  label_url: string;
  carrier: string;
  service_level: string;
  total_charge: number;
  currency: string;
  estimated_delivery?: Date;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

export interface TrackingResponse {
  tracking_number: string;
  carrier: string;
  status: string;
  estimated_delivery?: Date;
  actual_delivery?: Date;
  events: TrackingEvent[];
}

// ============================================================================
// SEKO CLIENT
// ============================================================================

export class SekoClient {
  private credentials: SekoCredentials;
  private baseUrl: string;

  constructor(credentials: SekoCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.baseUrl;
  }

  /**
   * Get shipping quotes from multiple carriers
   */
  async getQuotes(request: QuoteRequest): Promise<ShippingQuote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.credentials.apiKey}`,
          "X-API-Secret": this.credentials.apiSecret,
          "X-Profile-ID": this.credentials.profileId,
        },
        body: JSON.stringify({
          origin: request.origin,
          destination: request.destination,
          packages: request.packages,
          ship_date: request.ship_date?.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SEKO API Error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return data.quotes || [];
    } catch (error) {
      console.error("Error fetching SEKO quotes:", error);
      throw error;
    }
  }

  /**
   * Create a shipment with the selected carrier
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.credentials.apiKey}`,
          "X-API-Secret": this.credentials.apiSecret,
          "X-Profile-ID": this.credentials.profileId,
        },
        body: JSON.stringify({
          reference: request.reference_number,
          origin: request.origin,
          destination: request.destination,
          packages: request.packages,
          carrier: request.carrier,
          service_level: request.service_level,
          carrier_account_id: request.carrier_account_id,
          ship_date: request.ship_date?.toISOString(),
          special_instructions: request.special_instructions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SEKO API Error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        shipment_id: data.shipment_id,
        tracking_number: data.tracking_number,
        label_url: data.label_url,
        carrier: data.carrier,
        service_level: data.service_level,
        total_charge: data.total_charge,
        currency: data.currency,
        estimated_delivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      };
    } catch (error) {
      console.error("Error creating SEKO shipment:", error);
      throw error;
    }
  }

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tracking/${trackingNumber}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.credentials.apiKey}`,
          "X-API-Secret": this.credentials.apiSecret,
          "X-Profile-ID": this.credentials.profileId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SEKO API Error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        tracking_number: data.tracking_number,
        carrier: data.carrier,
        status: data.status,
        estimated_delivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
        actual_delivery: data.actual_delivery ? new Date(data.actual_delivery) : undefined,
        events: data.events?.map((event: any) => ({
          timestamp: new Date(event.timestamp),
          status: event.status,
          location: event.location,
          description: event.description,
        })) || [],
      };
    } catch (error) {
      console.error("Error tracking SEKO shipment:", error);
      throw error;
    }
  }

  /**
   * Get shipping label for a shipment
   * @param shipmentId SEKO shipment ID
   * @param format Label format (PDF or ZPL for thermal printers)
   */
  async getLabel(shipmentId: string, format: "PDF" | "ZPL" = "PDF"): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}/label?format=${format}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.credentials.apiKey}`,
          "X-API-Secret": this.credentials.apiSecret,
          "X-Profile-ID": this.credentials.profileId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SEKO API Error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return data.label_url;
    } catch (error) {
      console.error("Error fetching SEKO label:", error);
      throw error;
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${shipmentId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.credentials.apiKey}`,
          "X-API-Secret": this.credentials.apiSecret,
          "X-Profile-ID": this.credentials.profileId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SEKO API Error: ${error.message || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Error cancelling SEKO shipment:", error);
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton SEKO client instance
 * Uses environment variables for credentials
 */
export const sekoClient = new SekoClient({
  apiKey: SEKO_API_KEY,
  apiSecret: SEKO_API_SECRET,
  profileId: SEKO_PROFILE_ID,
  baseUrl: SEKO_BASE_URL,
});
