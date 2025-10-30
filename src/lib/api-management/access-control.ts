import { log } from '@/lib/logger';
/* eslint-disable security/detect-object-injection */
/**
 * Access Control Middleware for API Credentials
 *
 * Provides IP whitelisting, domain whitelisting, and access validation
 * Uses application-level enforcement for better flexibility and error messages
 */

import ipaddr from 'ipaddr.js';
import { db } from '@/lib/db';

/**
 * Access check result
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if an IP address is allowed based on whitelist
 *
 * Supports:
 * - Individual IPs: "192.168.1.100"
 * - CIDR notation: "192.168.1.0/24"
 * - IPv4 and IPv6
 *
 * @param clientIp - IP address to check
 * @param allowedIps - Array of allowed IPs/CIDR ranges
 * @returns True if IP is allowed
 */
export function isIpAllowed(
  clientIp: string,
  allowedIps: string[]
): boolean {
  // Empty whitelist = allow all
  if (!allowedIps || allowedIps.length === 0) {
    return true;
  }

  try {
    const parsedClientIp = ipaddr.process(clientIp);

    for (const allowed of allowedIps) {
      // Check if it's CIDR notation
      if (allowed.includes('/')) {
        if (matchCIDR(clientIp, allowed)) {
          return true;
        }
      } else {
        // Direct IP match
        try {
          const parsedAllowed = ipaddr.process(allowed);
          if (parsedClientIp.toString() === parsedAllowed.toString()) {
            return true;
          }
        } catch {
          // Invalid IP in whitelist, skip
          continue;
        }
      }
    }

    return false;
  } catch (error) {
    // Invalid client IP
    return false;
  }
}

/**
 * Check if an IP matches a CIDR range
 *
 * @param ip - IP address to check
 * @param cidr - CIDR range (e.g., "192.168.1.0/24")
 * @returns True if IP is in range
 */
export function matchCIDR(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const parsedIp = ipaddr.process(ip);
    const parsedRange = ipaddr.process(range);

    // Both must be same type (IPv4 or IPv6)
    if (parsedIp.kind() !== parsedRange.kind()) {
      return false;
    }

    return parsedIp.match(parsedRange, parseInt(bits, 10));
  } catch (error) {
    log.error('CIDR match error:', { error });
    return false;
  }
}

/**
 * Check if a domain is allowed based on whitelist
 *
 * Supports:
 * - Exact match: "api.example.com"
 * - Wildcard: "*.example.com"
 *
 * @param domain - Domain to check
 * @param allowedDomains - Array of allowed domains
 * @returns True if domain is allowed
 */
export function isDomainAllowed(
  domain: string,
  allowedDomains: string[]
): boolean {
  // Empty whitelist = allow all
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  // Normalize domain
  const normalizedDomain = domain.toLowerCase().trim();

  for (const allowed of allowedDomains) {
    const normalizedAllowed = allowed.toLowerCase().trim();

    // Exact match
    if (normalizedDomain === normalizedAllowed) {
      return true;
    }

    // Wildcard match: *.example.com
    if (normalizedAllowed.startsWith('*.')) {
      const baseDomain = normalizedAllowed.substring(2); // Remove *.
      if (
        normalizedDomain.endsWith(baseDomain) ||
        normalizedDomain === baseDomain
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate IP address format
 *
 * @param ip - IP address to validate
 * @returns True if valid IPv4 or IPv6 address
 */
export function isValidIp(ip: string): boolean {
  try {
    ipaddr.process(ip);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate CIDR notation
 *
 * @param cidr - CIDR string to validate
 * @returns True if valid CIDR notation
 */
export function isValidCIDR(cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    if (!bits) return false;

    const parsedRange = ipaddr.process(range);
    const bitsNum = parseInt(bits, 10);

    if (parsedRange.kind() === 'ipv4') {
      return bitsNum >= 0 && bitsNum <= 32;
    } else {
      return bitsNum >= 0 && bitsNum <= 128;
    }
  } catch {
    return false;
  }
}

/**
 * Validate domain name format
 *
 * @param domain - Domain to validate
 * @returns True if valid domain name
 */
export function isValidDomain(domain: string): boolean {
  // Allow wildcards
  if (domain.startsWith('*.')) {
    domain = domain.substring(2);
  }

  // Split domain into labels and validate each separately (safe, no backtracking)
  const labels = domain.split('.');

  // Must have at least 2 labels (domain.tld)
  if (labels.length < 2) return false;

  // Validate each label
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    // Label must be 1-63 characters
    if (label.length === 0 || label.length > 63) return false;

    // Label must start and end with alphanumeric
    if (!/^[a-z0-9]/i.test(label) || !/[a-z0-9]$/i.test(label)) return false;

    // Label can only contain alphanumeric and hyphens
    if (!/^[a-z0-9-]+$/i.test(label)) return false;

    // TLD (last label) must be at least 2 characters and alphabetic
    if (i === labels.length - 1 && (label.length < 2 || !/^[a-z]+$/i.test(label))) {
      return false;
    }
  }

  return true;
}

/**
 * Parse and validate IP whitelist
 *
 * @param ips - Array of IPs/CIDR ranges
 * @returns Validation result with errors
 */
export function validateIpWhitelist(ips: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const ip of ips) {
    const trimmed = ip.trim();
    if (!trimmed) continue;

    if (trimmed.includes('/')) {
      // CIDR notation
      if (!isValidCIDR(trimmed)) {
        errors.push(`Invalid CIDR notation: ${trimmed}`);
      }
    } else {
      // Regular IP
      if (!isValidIp(trimmed)) {
        errors.push(`Invalid IP address: ${trimmed}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse and validate domain whitelist
 *
 * @param domains - Array of domains
 * @returns Validation result with errors
 */
export function validateDomainWhitelist(domains: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const domain of domains) {
    const trimmed = domain.trim();
    if (!trimmed) continue;

    if (!isValidDomain(trimmed)) {
      errors.push(`Invalid domain: ${trimmed}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if access is allowed for a credential
 *
 * Checks:
 * - IP whitelist (if configured)
 * - Domain whitelist (if configured)
 *
 * @param params - Access check parameters
 * @returns Access check result
 */
export async function checkAccess(params: {
  credentialId: string;
  clientIp: string;
  domain?: string;
}): Promise<AccessCheckResult> {
  const { credentialId, clientIp, domain } = params;

  try {
    // Get credential with access control settings
    const credential = await db.api_credentials.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      return {
        allowed: false,
        reason: 'Credential not found',
      };
    }

    if (!credential.is_active) {
      return {
        allowed: false,
        reason: 'Credential is inactive',
      };
    }

    // Check IP whitelist
    const allowedIps = credential.allowed_ips as string[] | null;
    if (allowedIps && allowedIps.length > 0) {
      if (!isIpAllowed(clientIp, allowedIps)) {
        return {
          allowed: false,
          reason: `IP address ${clientIp} is not whitelisted`,
        };
      }
    }

    // Check domain whitelist (if domain provided)
    const allowedDomains = credential.allowed_domains as string[] | null;
    if (domain && allowedDomains && allowedDomains.length > 0) {
      if (!isDomainAllowed(domain, allowedDomains)) {
        return {
          allowed: false,
          reason: `Domain ${domain} is not whitelisted`,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    log.error('Access check error:', { error });
    return {
      allowed: false,
      reason: 'Access check failed',
    };
  }
}

/**
 * Get client IP from request headers
 *
 * Checks common proxy headers:
 * - x-forwarded-for
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * @param headers - Request headers
 * @returns Client IP address or null
 */
export function getClientIp(headers: Headers | Record<string, string | undefined>): string | null {
  // Convert Headers object to plain object if needed
  const headersObj = headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : headers;

  // Try various proxy headers
  const forwardedFor = headersObj['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  const realIp = headersObj['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = headersObj['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to direct connection IP (if available)
  return headersObj['x-client-ip'] || null;
}
