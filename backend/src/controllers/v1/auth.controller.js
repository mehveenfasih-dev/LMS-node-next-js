const authService = require("../../services/auth.service")
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

module.exports = { register, login, google, logout, me }
