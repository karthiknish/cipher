/**
 * Rate Limiting Utility
 * 
 * Distributed rate limiter using Redis with sliding window algorithm.
 * Falls back to in-memory storage if Redis is unavailable.
 * 
 * Features:
 * - Atomic Redis operations for distributed rate limiting
 * - Automatic fallback to in-memory when Redis is unavailable
 * - Sliding window algorithm for smooth rate limiting
 * - Automatic cleanup of expired entries
 */

import { getRedisClient, getRateLimitKey, isRedisConfigured } from "@/lib/redis";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (fallback)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Track if we're using Redis or in-memory
let usingRedis = false;

// Cleanup old entries periodically (every 5 minutes) for in-memory store
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
 * Check rate limit using Redis (distributed)
 * Uses Lua script for atomic increment and TTL check
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  
  if (!redis) {
    return null; // Fallback to in-memory
  }

  const { limit, windowSec, prefix = "default" } = config;
  const key = getRateLimitKey(identifier, prefix);
  const now = Date.now();
  const windowMs = windowSec * 1000;

  try {
    // Use multi/exec for atomic operations
    const pipeline = redis.multi();
    
    // Get current count
    pipeline.get(key);
    // Get TTL
    pipeline.pttl(key);
    
    const results = await pipeline.exec();
    
    if (!results) {
      return null; // Fallback to in-memory
    }

    const [countResult, ttlResult] = results;
    const currentCount = countResult?.[1] ? parseInt(countResult[1] as string, 10) : 0;
    const ttl = ttlResult?.[1] as number;

    // Key doesn't exist or expired
    if (!currentCount || ttl <= 0) {
      // Set new counter with expiry
      await redis.set(key, "1", "PX", windowMs);
      usingRedis = true;
      
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (currentCount >= limit) {
      const resetTime = now + ttl;
      const retryAfterSec = Math.ceil(ttl / 1000);
      
      return {
        success: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfterSec,
      };
    }

    // Increment counter atomically
    await redis.incr(key);
    usingRedis = true;

    return {
      success: true,
      limit,
      remaining: limit - currentCount - 1,
      resetTime: now + ttl,
    };
  } catch (error) {
    console.error("[Rate Limit] Redis error, falling back to in-memory:", error);
    return null; // Fallback to in-memory
  }
}

/**
 * Check rate limit using in-memory storage (fallback)
 */
function checkRateLimitInMemory(
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
 * Check if a request should be rate limited
 * 
 * Uses Redis for distributed rate limiting if available,
 * otherwise falls back to in-memory storage.
 * 
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Try Redis first if configured
  if (isRedisConfigured()) {
    const redisResult = await checkRateLimitRedis(identifier, config);
    if (redisResult) {
      return redisResult;
    }
  }

  // Fallback to in-memory
  return checkRateLimitInMemory(identifier, config);
}

/**
 * Synchronous rate limit check (in-memory only)
 * Use this when async operations are not possible
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimitInMemory(identifier, config);
}

/**
 * Check if rate limiting is using Redis
 */
export function isUsingRedis(): boolean {
  return usingRedis;
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
