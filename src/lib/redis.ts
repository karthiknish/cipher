/**
 * Redis Client Configuration
 * 
 * Provides a Redis client for distributed caching and rate limiting.
 * Supports both single Redis instance and Redis cluster configurations.
 * 
 * Environment Variables:
 * - REDIS_URL: Full Redis connection URL (redis://user:pass@host:port)
 * - Or individual variables:
 *   - REDIS_HOST: Redis server hostname (default: localhost)
 *   - REDIS_PORT: Redis server port (default: 6379)
 *   - REDIS_PASSWORD: Redis password (optional)
 *   - REDIS_DB: Redis database number (default: 0)
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;
let connectionFailed = false;

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.REDIS_URL ||
    process.env.REDIS_HOST ||
    process.env.UPSTASH_REDIS_REST_URL // Support Vercel's Upstash integration
  );
}

/**
 * Get Redis client instance (singleton pattern)
 * 
 * @returns Redis client or null if not configured/unavailable
 */
export function getRedisClient(): Redis | null {
  // Don't retry if previous connection failed
  if (connectionFailed) {
    return null;
  }

  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis is configured
  if (!isRedisConfigured()) {
    console.log("[Redis] Not configured - using in-memory fallback");
    return null;
  }

  try {
    // Connection options
    const options = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          connectionFailed = true;
          console.error("[Redis] Max retries exceeded - disabling Redis");
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Retry with exponential backoff
      },
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: false, // Fail fast if not connected
    };

    // Create client from URL or individual variables
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, options);
    } else {
      redisClient = new Redis({
        ...options,
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || "0", 10),
      });
    }

    // Handle connection events
    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });

    redisClient.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
      // Don't throw - allow fallback to in-memory
    });

    redisClient.on("close", () => {
      console.log("[Redis] Connection closed");
    });

    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to create client:", error);
    connectionFailed = true;
    return null;
  }
}

/**
 * Check if Redis connection is healthy
 */
export async function isRedisHealthy(): Promise<boolean> {
  const client = getRedisClient();
  
  if (!client) {
    return false;
  }

  try {
    const pong = await client.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Redis key prefix for rate limiting
 */
export const RATE_LIMIT_PREFIX = "ratelimit:";

/**
 * Generate a Redis key for rate limiting
 */
export function getRateLimitKey(identifier: string, endpoint: string): string {
  return `${RATE_LIMIT_PREFIX}${endpoint}:${identifier}`;
}
