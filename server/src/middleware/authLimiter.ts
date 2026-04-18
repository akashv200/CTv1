import rateLimit from "express-rate-limit";

/**
 * Phase 3: Auth endpoint rate limiter
 * Protects login, register, refresh endpoints from brute force
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  }
});

/**
 * Stricter rate limiter for password reset endpoints
 * 3 requests per 1 hour per IP
 */
export const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: "Too many password reset attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});
