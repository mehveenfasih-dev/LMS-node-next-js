const app = require("./app")
const { env } = require("./config/env")
const { API_PATHS } = require("./config/routes")
const { getDataProvider } = require("./providers")
const { attachSocketServer } = require("./realtime/socket")

let database

const start = async () => {
  database = getDataProvider().database
  await database.connect()
  const server = require("node:http").createServer(app)
  const io = attachSocketServer(server)
  server.listen(env.PORT, () => {
    console.log(`LMS API running on http://localhost:${env.PORT}${API_PATHS.V1} (${env.NODE_ENV})`)
    console.log(`Database provider: ${env.DB_PROVIDER}`)
    console.log(`CORS allows: ${env.CLIENT_ORIGINS.join(", ")}`)
  })

  let shuttingDown = false
  const shutdown = (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`${signal} received, shutting down...`)
    io.close(async () => {
      try {
        await database.disconnect()
      } catch (disconnectError) {
        console.error("Failed to disconnect the database:", disconnectError)
        process.exitCode = 1
      }
    })
  }
  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("SIGTERM", () => shutdown("SIGTERM"))
}

start().catch(async (error) => {
  console.error("Failed to start the LMS API:", error)
  if (database) {
    try {
      await database.disconnect()
    } catch (disconnectError) {
      console.error("Failed to disconnect the database:", disconnectError)
    }
  }
  process.exitCode = 1
})
