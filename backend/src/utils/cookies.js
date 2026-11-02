// Optional: the Next.js app sends the JWT as `Authorization: Bearer`, but we still set the cookie
// so Postman / other first-party clients keep working.
const { env } = require("../config/env")
const { ACCESS_COOKIE } = require("../config/constants")

const baseOptions = { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/" }

const setAuthCookie = (res, token) =>
  res.cookie(ACCESS_COOKIE, token, { ...baseOptions, maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000 })
const clearAuthCookie = (res) => res.clearCookie(ACCESS_COOKIE, baseOptions)

module.exports = { setAuthCookie, clearAuthCookie }
