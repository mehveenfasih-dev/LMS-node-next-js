const rateLimit = require("express-rate-limit")
const slowDown = require("express-slow-down")
const { env } = require("../config/env")

const skip = () => env.NODE_ENV === "test"

// Generous: one Next.js page render (SSR) can fire several calls from the same server IP.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { message: "Too many requests. Please slow down." },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { message: "Too many login attempts. Try again in a few minutes." },
})

const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 8,
  delayMs: (used) => (used - 5) * 500,
  skipSuccessfulRequests: true,
  skip,
})

module.exports = { apiLimiter, loginLimiter, loginSlowDown }
