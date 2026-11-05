const assert = require("node:assert/strict")
const { createServer } = require("node:http")
const { once } = require("node:events")
const test = require("node:test")
const jwt = require("jsonwebtoken")
const { io: createClient } = require("socket.io-client")

const users = {
  1: {
    userID: 1,
    role: { roleName: "admin" },
    fullName: "Admin",
    email: "admin@example.test",
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  2: {
    userID: 2,
    role: { roleName: "member" },
    fullName: "Member",
    email: "member@example.test",
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  3: {
    userID: 3,
    role: { roleName: "member" },
    fullName: "Inactive",
    email: "inactive@example.test",
    isActive: false,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  },
}

const providerPath = require.resolve("../src/providers")
require.cache[providerPath] = {
  id: providerPath,
  filename: providerPath,
  loaded: true,
  exports: {
    getDataProvider: () => ({
      repositories: {
        users: { findById: async (id) => users[id] ?? null },
      },
    }),
  },
}

const { env } = require("../src/config/env")
const { attachSocketServer, emitToAdmins, emitToUser } = require("../src/realtime/socket")

function ticket(userId) {
  return jwt.sign({ scope: "library:socket" }, env.SOCKET_AUTH_SECRET, {
    subject: userId,
    audience: "library-socket",
    issuer: "library-backend",
    expiresIn: "60s",
  })
}

function connect(url, token) {
  const socket = createClient(url, {
    autoConnect: false,
    reconnection: false,
    auth: token ? { token } : {},
  })
  const connected = new Promise((resolve, reject) => {
    socket.once("connect", resolve)
    socket.once("connect_error", reject)
  })
  socket.connect()
  return { socket, connected }
}

function receive(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), 1500)
    socket.once(event, (payload) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

test("socket authentication enforces private user and admin rooms", async () => {
  const server = createServer()
  const io = attachSocketServer(server)
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  const url = `http://127.0.0.1:${address.port}`
  const adminConnection = connect(url, ticket("1"))
  const memberConnection = connect(url, ticket("2"))
  const anonymousConnection = connect(url)
  const inactiveConnection = connect(url, ticket("3"))

  try {
    await Promise.all([adminConnection.connected, memberConnection.connected])
    await assert.rejects(anonymousConnection.connected, /Authentication required/)
    await assert.rejects(inactiveConnection.connected, /no longer active/)

    const adminRequest = receive(adminConnection.socket, "request:created")
    emitToAdmins("request:created", { id: "request-1" })
    assert.deepEqual(await adminRequest, { id: "request-1" })

    const memberNotification = receive(memberConnection.socket, "notification:new")
    emitToUser("2", "notification:new", { id: "private-to-member" })
    assert.deepEqual(await memberNotification, { id: "private-to-member" })

    let leakedAdminEvent = false
    let leakedPrivateNotification = false
    memberConnection.socket.on("request:created", () => {
      leakedAdminEvent = true
    })
    memberConnection.socket.on("notification:new", () => {
      leakedPrivateNotification = true
    })
    memberConnection.socket.emit("join", "admins")
    memberConnection.socket.emit("join", "user:1")
    emitToAdmins("request:created", { id: "admin-only" })
    emitToUser("1", "notification:new", { id: "admin-private" })
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert.equal(leakedAdminEvent, false)
    assert.equal(leakedPrivateNotification, false)
  } finally {
    adminConnection.socket.disconnect()
    memberConnection.socket.disconnect()
    anonymousConnection.socket.disconnect()
    inactiveConnection.socket.disconnect()
    await new Promise((resolve) => io.close(resolve))
  }
})
