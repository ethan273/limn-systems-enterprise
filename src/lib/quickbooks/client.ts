import { log } from '@/lib/logger';
/**
 * QuickBooks Online API Client
 *
 * Provides integration with QuickBooks Online API for:
 * - OAuth 2.0 authentication and token management
 * - Invoice creation and management
 * - Payment recording
 * - Customer sync
 * - Financial data retrieval
 *
 * Documentation: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice
 */

// Environment variables for QuickBooks API
// CRITICAL: Removed hardcoded fallback - requires proper environment configuration
const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const QB_ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || "sandbox";
const QB_REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI || "";
const QB_BASE_URL = QB_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

// ============================================================================
// TYPES
// ============================================================================

export interface QuickBooksCredentials {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
  redirectUri: string;
  baseUrl: string;
}

export interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  token_expiry: Date;
  refresh_token_expiry: Date;
  realm_id: string; // QuickBooks company ID
}

export interface QuickBooksCustomer {
  Id?: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1: string;
    City: string;
    CountrySubDivisionCode: string;
    PostalCode: string;
    Country: string;
  };
}

export interface QuickBooksInvoice {
  Id?: string;
  DocNumber?: string;
  TxnDate: string; // YYYY-MM-DD
  CustomerRef: {
    value: string; // QuickBooks Customer ID
  };
  Line: Array<{
    Amount: number;
    DetailType: "SalesItemLineDetail";
    Description?: string;
    SalesItemLineDetail: {
      Qty: number;
      UnitPrice: number;
      ItemRef: {
        value: string; // QuickBooks Item ID
        name?: string;
      };
    };
  }>;
  DueDate?: string; // YYYY-MM-DD
  PrivateNote?: string;
  BillEmail?: {
    Address: string;
  };
  TotalAmt?: number;
  Balance?: number;
  SyncToken?: string;
}

export interface QuickBooksPayment {
  Id?: string;
  TxnDate: string; // YYYY-MM-DD
  TotalAmt: number;
  CustomerRef: {
    value: string; // QuickBooks Customer ID
  };
  PaymentRefNum?: string; // Transaction/Reference number
  PrivateNote?: string;
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string; // QuickBooks Invoice ID
      TxnType: "Invoice";
    }>;
  }>;
  PaymentMethodRef?: {
    value: string; // QuickBooks Payment Method ID
  };
}

export interface QuickBooksItem {
  Id?: string;
  Name: string;
  Type: "Service" | "Inventory";
  IncomeAccountRef: {
    value: string;
  };
  UnitPrice?: number;
  Description?: string;
}

// ============================================================================
// QUICKBOOKS CLIENT
// ============================================================================

export class QuickBooksClient {
  private credentials: QuickBooksCredentials;
  private baseUrl: string;
  private tokens: QuickBooksTokens | null = null;

  constructor(credentials: QuickBooksCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.baseUrl;
  }

  /**
   * Set OAuth tokens (retrieved from database)
   */
  setTokens(tokens: QuickBooksTokens) {
    this.tokens = tokens;
  }

  /**
   * Check if access token is expired
   */
  isAccessTokenExpired(): boolean {
    if (!this.tokens) return true;
    return new Date() >= new Date(this.tokens.token_expiry);
  }

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired(): boolean {
    if (!this.tokens) return true;
    return new Date() >= new Date(this.tokens.refresh_token_expiry);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<QuickBooksTokens> {
    if (!this.tokens) {
      throw new Error("No tokens available. Please authenticate first.");
    }

    if (this.isRefreshTokenExpired()) {
      throw new Error("Refresh token has expired. Please re-authenticate.");
    }

    try {
      const authString = Buffer.from(
        `${this.credentials.clientId}:${this.credentials.clientSecret}`
      ).toString("base64");

      const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${authString}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token refresh failed: ${error.error || response.statusText}`);
      }

      const data = await response.json();

      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expiry: new Date(Date.now() + data.expires_in * 1000),
        refresh_token_expiry: new Date(Date.now() + data.x_refresh_token_expires_in * 1000),
        realm_id: this.tokens.realm_id,
      };

      return this.tokens;
    } catch (error) {
      log.error("Error refreshing QuickBooks access token:", { error });
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    if (!this.tokens) {
      throw new Error("No tokens available. Please authenticate first.");
    }

    // Refresh token if expired
    if (this.isAccessTokenExpired()) {
      await this.refreshAccessToken();
    }

    const url = `${this.baseUrl}/v3/company/${this.tokens.realm_id}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.tokens.access_token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `QuickBooks API Error: ${error.Fault?.Error?.[0]?.Message || response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      log.error("QuickBooks API request failed:", { error });
      throw error;
    }
  }

  // ============================================================================
  // CUSTOMER OPERATIONS
  // ============================================================================

  /**
   * Create or update customer in QuickBooks
   */
  async syncCustomer(customer: QuickBooksCustomer): Promise<QuickBooksCustomer> {
    try {
      if (customer.Id) {
        // Update existing customer
        return await this.makeRequest<any>("POST", "/customer", customer);
      } else {
        // Create new customer
        return await this.makeRequest<any>("POST", "/customer", customer);
      }
    } catch (error) {
      log.error("Error syncing customer to QuickBooks:", { error });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<QuickBooksCustomer> {
    try {
      const data = await this.makeRequest<any>("GET", `/customer/${customerId}`);
      return data.Customer;
    } catch (error) {
      log.error("Error fetching customer from QuickBooks:", { error });
      throw error;
    }
  }

  // ============================================================================
  // INVOICE OPERATIONS
  // ============================================================================

  /**
   * Create invoice in QuickBooks
   */
  async createInvoice(invoice: QuickBooksInvoice): Promise<QuickBooksInvoice> {
    try {
      const data = await this.makeRequest<any>("POST", "/invoice", invoice);
      return data.Invoice;
    } catch (error) {
      log.error("Error creating invoice in QuickBooks:", { error });
      throw error;
    }
  }

  /**
   * Update invoice in QuickBooks
   */
  async updateInvoice(invoice: QuickBooksInvoice): Promise<QuickBooksInvoice> {
    try {
      if (!invoice.Id || !invoice.SyncToken) {
        throw new Error("Invoice ID and SyncToken are required for update");
      }
      const data = await this.makeRequest<any>("POST", "/invoice", invoice);
      return data.Invoice;
    } catch (error) {
      log.error("Error updating invoice in QuickBooks:", { error });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<QuickBooksInvoice> {
    try {
      const data = await this.makeRequest<any>("GET", `/invoice/${invoiceId}`);
      return data.Invoice;
    } catch (error) {
      log.error("Error fetching invoice from QuickBooks:", { error });
      throw error;
    }
  }

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  /**
   * Record payment in QuickBooks
   */
  async createPayment(payment: QuickBooksPayment): Promise<QuickBooksPayment> {
    try {
      const data = await this.makeRequest<any>("POST", "/payment", payment);
      return data.Payment;
    } catch (error) {
      log.error("Error creating payment in QuickBooks:", { error });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<QuickBooksPayment> {
    try {
      const data = await this.makeRequest<any>("GET", `/payment/${paymentId}`);
      return data.Payment;
    } catch (error) {
      log.error("Error fetching payment from QuickBooks:", { error });
      throw error;
    }
  }

  // ============================================================================
  // ITEM OPERATIONS
  // ============================================================================

  /**
   * Create or update item in QuickBooks
   */
  async syncItem(item: QuickBooksItem): Promise<QuickBooksItem> {
    try {
      if (item.Id) {
        // Update existing item
        return await this.makeRequest<any>("POST", "/item", item);
      } else {
        // Create new item
        return await this.makeRequest<any>("POST", "/item", item);
      }
    } catch (error) {
      log.error("Error syncing item to QuickBooks:", { error });
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async getItem(itemId: string): Promise<QuickBooksItem> {
    try {
      const data = await this.makeRequest<any>("GET", `/item/${itemId}`);
      return data.Item;
    } catch (error) {
      log.error("Error fetching item from QuickBooks:", { error });
      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Execute SQL-like query against QuickBooks data
   */
  async query<T>(queryString: string): Promise<T[]> {
    try {
      const data = await this.makeRequest<any>(
        "GET",
        `/query?query=${encodeURIComponent(queryString)}`
      );
      return data.QueryResponse || [];
    } catch (error) {
      log.error("Error executing QuickBooks query:", { error });
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton QuickBooks client instance
 * Note: Tokens must be set via setTokens() before use
 */
export const quickbooksClient = new QuickBooksClient({
  clientId: QB_CLIENT_ID,
  clientSecret: QB_CLIENT_SECRET,
  environment: QB_ENVIRONMENT as "sandbox" | "production",
  redirectUri: QB_REDIRECT_URI,
  baseUrl: QB_BASE_URL,
});
