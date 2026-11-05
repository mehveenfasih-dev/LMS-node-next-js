const jwt = require("jsonwebtoken")
const { Server } = require("socket.io")
const { env } = require("../config/env")
const { ROLES } = require("../config/constants")
const { getDataProvider } = require("../providers")
const { toLibraryUser } = require("../utils/serializers")

let io
const connectionAttempts = new Map()

const userRoom = (userId) => `user:${userId}`

function allowConnection(address) {
  const now = Date.now()
  const windowMs = 60_000
  const limit = 120
  let attempt = connectionAttempts.get(address)
  if (!attempt || now - attempt.startedAt >= windowMs) {
    attempt = { startedAt: now, count: 0 }
  }
  attempt.count += 1
  connectionAttempts.set(address, attempt)
  if (connectionAttempts.size > 2000) {
    for (const [key, value] of connectionAttempts) {
      if (now - value.startedAt >= windowMs) connectionAttempts.delete(key)
    }
  }
  return attempt.count <= limit
}

function attachSocketServer(server) {
  if (io) throw new Error("The Socket.IO server has already been initialized.")
  io = new Server(server, {
    maxHttpBufferSize: 64 * 1024,
    cors: {
      origin: env.CLIENT_ORIGINS,
      methods: ["GET", "POST"],
      credentials: false,
    },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin
      callback(null, !origin || env.CLIENT_ORIGINS.includes(origin))
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  })

  io.use(async (socket, next) => {
    if (!allowConnection(socket.handshake.address || "unknown")) {
      return next(new Error("Too many connection attempts. Please try again later."))
    }
    const token = socket.handshake.auth?.token
    if (typeof token !== "string" || token.length > 4096) {
      return next(new Error("Authentication required."))
    }

    try {
      const payload = jwt.verify(token, env.SOCKET_AUTH_SECRET, {
        audience: "library-socket",
        issuer: ["library-backend", "library-nextjs"],
      })
      if (payload.scope !== "library:socket" || typeof payload.sub !== "string") {
        return next(new Error("Invalid socket authentication token."))
      }

      const user = await getDataProvider().repositories.users.findById(payload.sub)
      if (!user || !user.isActive) return next(new Error("Your account is no longer active."))
      const libraryUser = toLibraryUser(user)
      socket.data.user = libraryUser
      next()
    } catch (error) {
      console.warn("Socket authentication failed:", error.message)
      next(new Error("Socket authentication failed."))
    }
  })

  io.on("connection", (socket) => {
    const user = socket.data.user
    socket.join(userRoom(user.id))
    if (user.role === ROLES.ADMIN) socket.join("admins")
    console.info(`Socket connected for user ${user.id}.`)
    socket.on("disconnect", (reason) => {
      console.info(`Socket disconnected for user ${user.id}: ${reason}.`)
    })
  })

  io.engine.on("connection_error", (error) => {
    console.warn("Socket transport connection failed:", error.message)
  })

  return io
}

const emitToUser = (userId, event, payload) => {
  if (io) io.to(userRoom(userId)).emit(event, payload)
}

const emitToAdmins = (event, payload) => {
  if (io) io.to("admins").emit(event, payload)
}

const disconnectUser = (userId) => {
  if (io) io.in(userRoom(userId)).disconnectSockets(true)
}

module.exports = { attachSocketServer, emitToUser, emitToAdmins, disconnectUser }
