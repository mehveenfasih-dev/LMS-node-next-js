const authService = require("../../services/auth.service")
const jwt = require("jsonwebtoken")
const { env } = require("../../config/env")
const { setAuthCookie, clearAuthCookie } = require("../../utils/cookies")

const register = async (req, res) => res.status(201).json(await authService.register(req.body))

// Returns { user, token }. The Next.js server keeps `token` inside its (encrypted) NextAuth session.
const login = async (req, res) => {
  const { user, token } = await authService.login(req.body)
  setAuthCookie(res, token)
  res.json({ user, token })
}

const google = async (req, res) => res.json(await authService.googleSignIn(req.body))

const logout = (req, res) => {
  clearAuthCookie(res)
  res.status(204).send()
}

const me = (req, res) => res.json({ user: req.user })

const socketTicket = (req, res) => {
  const token = jwt.sign(
    { scope: "library:socket" },
    env.SOCKET_AUTH_SECRET,
    {
      subject: req.user.id,
      audience: "library-socket",
      issuer: "library-backend",
      expiresIn: "60s",
    },
  )
  res.set("Cache-Control", "no-store")
  res.json({ token })
}

module.exports = { register, login, google, logout, me, socketTicket }
