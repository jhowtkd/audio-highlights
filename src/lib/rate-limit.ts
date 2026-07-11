/**
 * In-memory rate limiter for API routes
 * Note: For a production app with multiple instances, a distributed cache like Redis should be used.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60 * 1000).unref(); // Run every minute, don't keep process alive

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export function rateLimit(identifier: string, config: RateLimitConfig): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = store[identifier];

  if (!record) {
    store[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return { success: true, limit: config.limit, remaining: config.limit - 1, reset: store[identifier].resetTime };
  }

  if (now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return { success: true, limit: config.limit, remaining: config.limit - 1, reset: store[identifier].resetTime };
  }

  if (record.count >= config.limit) {
    return { success: false, limit: config.limit, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit: config.limit, remaining: config.limit - record.count, reset: record.resetTime };
}
