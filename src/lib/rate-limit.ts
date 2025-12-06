/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter using sliding window algorithm.
 * Suitable for single-instance deployments.
 * 
 * Features:
 * - Sliding window algorithm for smooth rate limiting
 * - Automatic cleanup of expired entries
 * - Zero external dependencies
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSec: number;
  /** Unique identifier prefix for this limiter */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSec?: number;
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimitSync(identifier, config);
}

/**
 * Synchronous rate limit check
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowSec, prefix = "default" } = config;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  const existing = rateLimitStore.get(key);

  // If no existing entry or window has expired, create new entry
  if (!existing || existing.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (existing.count >= limit) {
    const retryAfterSec = Math.ceil((existing.resetTime - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfterSec,
    };
  }

  // Increment count
  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetTime: existing.resetTime,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback for development
  return "127.0.0.1";
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const RATE_LIMITS = {
  // AI endpoints - more restrictive (costs money)
  AI_GENERATION: {
    limit: 10,
    windowSec: 60, // 10 requests per minute
    prefix: "ai",
  },
  
  // Virtual try-on - very restrictive (expensive)
  TRY_ON: {
    limit: 5,
    windowSec: 60, // 5 requests per minute
    prefix: "tryon",
  },
  
  // Chat - moderate
  CHAT: {
    limit: 20,
    windowSec: 60, // 20 messages per minute
    prefix: "chat",
  },
  
  // Analytics - lenient but protected
  ANALYTICS: {
    limit: 100,
    windowSec: 60, // 100 events per minute
    prefix: "analytics",
  },
  
  // Email sending - very restrictive
  EMAIL: {
    limit: 5,
    windowSec: 300, // 5 emails per 5 minutes
    prefix: "email",
  },
  
  // General API - moderate
  API_GENERAL: {
    limit: 60,
    windowSec: 60, // 60 requests per minute
    prefix: "api",
  },
} as const;

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
    ...(result.retryAfterSec ? { "Retry-After": result.retryAfterSec.toString() } : {}),
  };
}
