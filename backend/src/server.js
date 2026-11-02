const app = require("./app")
const { env } = require("./config/env")
const { API_PATHS } = require("./config/routes")
const { getDataProvider } = require("./providers")

let database

const start = async () => {
  database = getDataProvider().database
  await database.connect()
  const server = app.listen(env.PORT, () => {
    console.log(`LMS API running on http://localhost:${env.PORT}${API_PATHS.V1} (${env.NODE_ENV})`)
    console.log(`Database provider: ${env.DB_PROVIDER}`)
    console.log(`CORS allows: ${env.CLIENT_ORIGINS.join(", ")}`)
  })

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`)
    server.close(async () => {
      await database.disconnect()
      process.exit(0)
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
