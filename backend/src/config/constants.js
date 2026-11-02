const ROLES = { ADMIN: "admin", MEMBER: "member" }

// Name of the (optional) httpOnly cookie set at login. The Next.js app uses the Bearer token instead.
const ACCESS_COOKIE = "lms_access"

module.exports = { ROLES, ACCESS_COOKIE }
