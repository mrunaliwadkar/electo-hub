import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
let redis: Redis | null = null;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000, // 2 seconds timeout
  });
  redis.on("error", (err) => {
    console.warn("Redis connection error, rate limiting will fail-open:", err.message);
  });
} catch (e) {
  console.warn("Failed to initialize Redis client:", e);
}

/**
 * Sliding Window Rate Limiter using Redis Sorted Sets
 */
export async function isRateLimited(key: string, limit: number, windowSeconds = 60): Promise<boolean> {
  if (!redis) return false; // Fail-open if Redis is not configured

  try {
    const now = Date.now();
    const clearBefore = now - windowSeconds * 1000;

    const multi = redis.multi();
    // Remove timestamps older than the window
    multi.zremrangebyscore(key, 0, clearBefore);
    // Count elements in the window
    multi.zcard(key);
    // Add current timestamp
    multi.zadd(key, now, `${now}-${Math.random()}`);
    // Set TTL to prevent memory leaks
    multi.expire(key, windowSeconds + 10);

    const results = await multi.exec();
    if (!results) return false;

    // results[1] corresponds to the zcard command result [err, count]
    const count = results[1][1] as number;
    return count > limit;
  } catch (error) {
    console.error("Rate limiter error, allowing request (fail-open):", error);
    return false;
  }
}
