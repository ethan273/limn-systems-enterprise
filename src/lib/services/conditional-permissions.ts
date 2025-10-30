import { log } from '@/lib/logger';
/**
 * Conditional Permissions Service
 *
 * Implements time, location, device, and IP-based access control constraints.
 * Part of RBAC Phase 2.3 - Advanced Permission Features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Types and Interfaces
// ============================================

export type ConditionType = 'time' | 'location' | 'device' | 'ip_range';

export interface PermissionContext {
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: GeoLocation;
  deviceInfo?: DeviceInfo;
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  isCorporate?: boolean;
}

export interface TimeCondition {
  timeStart?: string;  // HH:MM:SS
  timeEnd?: string;    // HH:MM:SS
  daysOfWeek?: number[]; // 1=Monday, 7=Sunday
  timezone: string;
}

export interface LocationCondition {
  allowedCountries?: string[];
  allowedRegions?: string[];
  allowedCities?: string[];
  geoFence?: GeoFencePolygon;
}

export interface GeoFencePolygon {
  coordinates: Array<{ lat: number; lon: number }>;
}

export interface DeviceCondition {
  allowedDeviceTypes?: string[];
  requiredOS?: string[];
  corporateDeviceOnly: boolean;
}

export interface IPCondition {
  allowedIPRanges?: string[]; // CIDR notation
}

export interface ConditionEvaluationResult {
  allowed: boolean;
  reason?: string;
  conditionType: ConditionType;
}

// ============================================
// Time-Based Condition Evaluation
// ============================================

/**
 * Evaluates time-based access conditions
 */
export async function evaluateTimeCondition(
  conditionId: string,
  context: PermissionContext
): Promise<ConditionEvaluationResult> {
  try {
    const condition = await prisma.permission_conditions.findUnique({
      where: { id: conditionId },
    });

    if (!condition || condition.condition_type !== 'time') {
      return {
        allowed: false,
        reason: 'Time condition not found',
        conditionType: 'time',
      };
    }

    if (!condition.is_active) {
      return {
        allowed: false,
        reason: 'Time condition is inactive',
        conditionType: 'time',
      };
    }

    const now = context.timestamp;
    const timezone = condition.timezone || 'UTC';

    // Convert current time to the condition's timezone
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Check time window
    if (condition.time_start && condition.time_end) {
      const timeStart = String(condition.time_start);
      const timeEnd = String(condition.time_end);

      if (currentTime < timeStart || currentTime > timeEnd) {
        return {
          allowed: false,
          reason: `Access denied: outside permitted time window (${timeStart} - ${timeEnd} ${timezone})`,
          conditionType: 'time',
        };
      }
    }

    // Check day of week
    if (condition.days_of_week && condition.days_of_week.length > 0) {
      const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const adjustedDay = currentDay === 0 ? 7 : currentDay; // Convert to 1=Monday, 7=Sunday

      if (!condition.days_of_week.includes(adjustedDay)) {
        return {
          allowed: false,
          reason: `Access denied: not allowed on this day of week`,
          conditionType: 'time',
        };
      }
    }

    return {
      allowed: true,
      conditionType: 'time',
    };
  } catch (error) {
    log.error('[Conditional Permissions] Error evaluating time condition:', { error });
    return {
      allowed: false,
      reason: 'Error evaluating time condition',
      conditionType: 'time',
    };
  }
}

// ============================================
// Location-Based Condition Evaluation
// ============================================

/**
 * Checks if a point is inside a polygon (geo-fence)
 */
function pointInPolygon(point: { lat: number; lon: number }, polygon: GeoFencePolygon): boolean {
  const { lat: x, lon: y } = point;
  const coords = polygon.coordinates;
  let inside = false;

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i]!.lon;
    const yi = coords[i]!.lat;
    const xj = coords[j]!.lon;
    const yj = coords[j]!.lat;

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Evaluates location-based access conditions
 */
export async function evaluateLocationCondition(
  conditionId: string,
  context: PermissionContext
): Promise<ConditionEvaluationResult> {
  try {
    const condition = await prisma.permission_conditions.findUnique({
      where: { id: conditionId },
    });

    if (!condition || condition.condition_type !== 'location') {
      return {
        allowed: false,
        reason: 'Location condition not found',
        conditionType: 'location',
      };
    }

    if (!condition.is_active) {
      return {
        allowed: false,
        reason: 'Location condition is inactive',
        conditionType: 'location',
      };
    }

    if (!context.geoLocation) {
      return {
        allowed: false,
        reason: 'Geographic location unavailable',
        conditionType: 'location',
      };
    }

    // Check country
    if (condition.allowed_countries && condition.allowed_countries.length > 0) {
      if (!context.geoLocation.country || !condition.allowed_countries.includes(context.geoLocation.country)) {
        return {
          allowed: false,
          reason: `Access denied: country not permitted`,
          conditionType: 'location',
        };
      }
    }

    // Check region
    if (condition.allowed_regions && condition.allowed_regions.length > 0) {
      if (!context.geoLocation.region || !condition.allowed_regions.includes(context.geoLocation.region)) {
        return {
          allowed: false,
          reason: `Access denied: region not permitted`,
          conditionType: 'location',
        };
      }
    }

    // Check city
    if (condition.allowed_cities && condition.allowed_cities.length > 0) {
      if (!context.geoLocation.city || !condition.allowed_cities.includes(context.geoLocation.city)) {
        return {
          allowed: false,
          reason: `Access denied: city not permitted`,
          conditionType: 'location',
        };
      }
    }

    // Check geo-fence
    if (condition.geo_fence && context.geoLocation.lat && context.geoLocation.lon) {
      const geoFence = condition.geo_fence as unknown as GeoFencePolygon;
      const point = { lat: context.geoLocation.lat, lon: context.geoLocation.lon };

      if (!pointInPolygon(point, geoFence)) {
        return {
          allowed: false,
          reason: `Access denied: outside permitted geographic area`,
          conditionType: 'location',
        };
      }
    }

    return {
      allowed: true,
      conditionType: 'location',
    };
  } catch (error) {
    log.error('[Conditional Permissions] Error evaluating location condition:', { error });
    return {
      allowed: false,
      reason: 'Error evaluating location condition',
      conditionType: 'location',
    };
  }
}

// ============================================
// Device-Based Condition Evaluation
// ============================================

/**
 * Evaluates device-based access conditions
 */
export async function evaluateDeviceCondition(
  conditionId: string,
  context: PermissionContext
): Promise<ConditionEvaluationResult> {
  try {
    const condition = await prisma.permission_conditions.findUnique({
      where: { id: conditionId },
    });

    if (!condition || condition.condition_type !== 'device') {
      return {
        allowed: false,
        reason: 'Device condition not found',
        conditionType: 'device',
      };
    }

    if (!condition.is_active) {
      return {
        allowed: false,
        reason: 'Device condition is inactive',
        conditionType: 'device',
      };
    }

    if (!context.deviceInfo) {
      return {
        allowed: false,
        reason: 'Device information unavailable',
        conditionType: 'device',
      };
    }

    // Check device type
    if (condition.allowed_device_types && condition.allowed_device_types.length > 0) {
      if (!condition.allowed_device_types.includes(context.deviceInfo.type)) {
        return {
          allowed: false,
          reason: `Access denied: device type not permitted`,
          conditionType: 'device',
        };
      }
    }

    // Check OS
    if (condition.required_os && condition.required_os.length > 0) {
      const osLower = context.deviceInfo.os.toLowerCase();
      const osMatches = condition.required_os.some(requiredOS =>
        osLower.includes(requiredOS.toLowerCase())
      );

      if (!osMatches) {
        return {
          allowed: false,
          reason: `Access denied: operating system not permitted`,
          conditionType: 'device',
        };
      }
    }

    // Check corporate device requirement
    if (condition.corporate_device_only && !context.deviceInfo.isCorporate) {
      return {
        allowed: false,
        reason: `Access denied: corporate device required`,
        conditionType: 'device',
      };
    }

    return {
      allowed: true,
      conditionType: 'device',
    };
  } catch (error) {
    log.error('[Conditional Permissions] Error evaluating device condition:', { error });
    return {
      allowed: false,
      reason: 'Error evaluating device condition',
      conditionType: 'device',
    };
  }
}

// ============================================
// IP-Based Condition Evaluation
// ============================================

/**
 * Checks if an IP address is within a CIDR range
 */
function ipInRange(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = bits ? ~(Math.pow(2, 32 - parseInt(bits)) - 1) : -1;

    const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    const rangeNum = range!.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;

    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

/**
 * Evaluates IP-based access conditions
 */
export async function evaluateIPCondition(
  conditionId: string,
  context: PermissionContext
): Promise<ConditionEvaluationResult> {
  try {
    const condition = await prisma.permission_conditions.findUnique({
      where: { id: conditionId },
    });

    if (!condition || condition.condition_type !== 'ip_range') {
      return {
        allowed: false,
        reason: 'IP condition not found',
        conditionType: 'ip_range',
      };
    }

    if (!condition.is_active) {
      return {
        allowed: false,
        reason: 'IP condition is inactive',
        conditionType: 'ip_range',
      };
    }

    if (!context.ipAddress) {
      return {
        allowed: false,
        reason: 'IP address unavailable',
        conditionType: 'ip_range',
      };
    }

    // Check allowed IP ranges
    if (condition.allowed_ip_ranges && condition.allowed_ip_ranges.length > 0) {
      const ipMatches = condition.allowed_ip_ranges.some(range =>
        ipInRange(context.ipAddress!, range)
      );

      if (!ipMatches) {
        return {
          allowed: false,
          reason: `Access denied: IP address not in permitted ranges`,
          conditionType: 'ip_range',
        };
      }
    }

    return {
      allowed: true,
      conditionType: 'ip_range',
    };
  } catch (error) {
    log.error('[Conditional Permissions] Error evaluating IP condition:', { error });
    return {
      allowed: false,
      reason: 'Error evaluating IP condition',
      conditionType: 'ip_range',
    };
  }
}

// ============================================
// Condition Management
// ============================================

/**
 * Creates a new permission condition
 */
export async function createPermissionCondition(data: {
  permissionId: string;
  userId?: string;
  roleId?: string;
  conditionType: ConditionType;
  config: TimeCondition | LocationCondition | DeviceCondition | IPCondition;
  createdBy: string;
}) {
  const conditionData: any = {
    permission_id: data.permissionId,
    condition_type: data.conditionType,
    is_active: true,
    created_by: data.createdBy,
  };

  if (data.userId) conditionData.user_id = data.userId;
  if (data.roleId) conditionData.role_id = data.roleId;

  // Map config to database columns based on condition type
  if (data.conditionType === 'time') {
    const timeConfig = data.config as TimeCondition;
    conditionData.time_start = timeConfig.timeStart;
    conditionData.time_end = timeConfig.timeEnd;
    conditionData.days_of_week = timeConfig.daysOfWeek;
    conditionData.timezone = timeConfig.timezone;
  } else if (data.conditionType === 'location') {
    const locConfig = data.config as LocationCondition;
    conditionData.allowed_countries = locConfig.allowedCountries;
    conditionData.allowed_regions = locConfig.allowedRegions;
    conditionData.allowed_cities = locConfig.allowedCities;
    conditionData.geo_fence = locConfig.geoFence;
  } else if (data.conditionType === 'device') {
    const devConfig = data.config as DeviceCondition;
    conditionData.allowed_device_types = devConfig.allowedDeviceTypes;
    conditionData.required_os = devConfig.requiredOS;
    conditionData.corporate_device_only = devConfig.corporateDeviceOnly;
  } else if (data.conditionType === 'ip_range') {
    const ipConfig = data.config as IPCondition;
    conditionData.allowed_ip_ranges = ipConfig.allowedIPRanges;
  }

  return prisma.permission_conditions.create({
    data: conditionData,
  });
}

/**
 * Gets all active conditions for a permission
 */
export async function getPermissionConditions(permissionId: string) {
  return prisma.permission_conditions.findMany({
    where: {
      permission_id: permissionId,
      is_active: true,
    },
  });
}

/**
 * Evaluates all conditions for a permission
 */
export async function evaluateAllConditions(
  permissionId: string,
  context: PermissionContext
): Promise<{ allowed: boolean; failures: ConditionEvaluationResult[] }> {
  const conditions = await getPermissionConditions(permissionId);

  if (conditions.length === 0) {
    return { allowed: true, failures: [] };
  }

  const results = await Promise.all(
    conditions.map(async (condition) => {
      switch (condition.condition_type) {
        case 'time':
          return evaluateTimeCondition(condition.id, context);
        case 'location':
          return evaluateLocationCondition(condition.id, context);
        case 'device':
          return evaluateDeviceCondition(condition.id, context);
        case 'ip_range':
          return evaluateIPCondition(condition.id, context);
        default:
          return {
            allowed: false,
            reason: 'Unknown condition type',
            conditionType: condition.condition_type as ConditionType,
          };
      }
    })
  );

  const failures = results.filter(r => !r.allowed);
  const allowed = failures.length === 0;

  return { allowed, failures };
}
