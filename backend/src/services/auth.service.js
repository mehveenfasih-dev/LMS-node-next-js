const jwt = require("jsonwebtoken")
const { env } = require("../config/env")
const ApiError = require("../utils/ApiError")
const userRepository = require("../repositories/user.repository")
const { verifyPassword } = require("../utils/password")
const { toLibraryUser } = require("../utils/serializers")

const signToken = (user) =>
  jwt.sign({ role: user.role.roleName }, env.JWT_SECRET, {
    subject: String(user.userID), // -> `sub`, the same id as session.user.id in Next.js
    expiresIn: Math.round(env.SESSION_DAYS * 24 * 60 * 60),
  })

const register = async (input) => {
  if (await userRepository.findByEmail(input.email)) {
    throw ApiError.conflict("An account with this email already exists.")
  }
  // Same product rule as the Next.js registerUserAction: public registration creates MEMBERS.
  return toLibraryUser(await userRepository.createMember(input))
}

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email)
  const ok = await verifyPassword(password, user?.passwordHash)
  if (!user || !ok) throw ApiError.unauthorized("Email or password is incorrect.")
  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated.")
  return { user: toLibraryUser(user), token: signToken(user) }
}

// Called by the Next.js server (never the browser) AFTER NextAuth verified the Google account.
const googleSignIn = async ({ email, name }) => {
  const user = await userRepository.findOrCreateGoogle({ email, name })
  if (!user.isActive) throw ApiError.forbidden("This account is inactive.")
  return { user: toLibraryUser(user), token: signToken(user) }
}

module.exports = { register, login, googleSignIn }
