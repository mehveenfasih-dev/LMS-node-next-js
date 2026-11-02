const { timingSafeEqual } = require("node:crypto")
const jwt = require("jsonwebtoken")
const { env } = require("../config/env")
const { ACCESS_COOKIE } = require("../config/constants")
const ApiError = require("../utils/ApiError")
const userRepository = require("../repositories/user.repository")
const { toLibraryUser } = require("../utils/serializers")

// Bearer header first (Next.js app), cookie second (optional: Postman / same-site clients).
const readToken = (req) => {
  const header = req.headers.authorization ?? ""
  if (header.startsWith("Bearer ")) return header.slice(7)
  return req.cookies?.[ACCESS_COOKIE] ?? null
}

const authenticate = async (req, res, next) => {
  const token = readToken(req)
  if (!token) throw ApiError.unauthorized()

  let payload
  try {
    payload = jwt.verify(token, env.JWT_SECRET)
  } catch (error) {
    throw ApiError.unauthorized(
      error.name === "TokenExpiredError" ? "Your session has expired. Please sign in again." : "Invalid authentication token.",
    )
  }

  // Re-read the user on EVERY request (same as getActiveUserById in Next.js): role changes and
  // deactivation take effect immediately, and the role inside the token is never trusted.
  let user
  try {
    user = await userRepository.findById(payload.sub)
  } catch {
    throw ApiError.unauthorized("Invalid authentication token.")
  }
  if (!user || !user.isActive) throw ApiError.unauthorized("Your account is no longer active.")

  req.user = toLibraryUser(user)
  next()
}

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) throw ApiError.forbidden()
  next()
}

// Server-to-server only (Next.js -> POST /auth/google).
const requireInternalKey = (req, res, next) => {
  const expected = Buffer.from(env.INTERNAL_API_KEY)
  const sent = Buffer.from(req.get("x-internal-key") ?? "")
  if (!expected.length || sent.length !== expected.length || !timingSafeEqual(sent, expected)) throw ApiError.forbidden()
  next()
}

module.exports = { authenticate, authorize, requireInternalKey }
