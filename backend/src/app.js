// app.js builds the Express app but does NOT listen. server.js listens.
const express = require("express")
const helmet = require("helmet")
const morgan = require("morgan")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const { env } = require("./config/env")
const { API_PATHS } = require("./config/routes")
const { getDataProvider } = require("./providers")
const { apiLimiter } = require("./middleware/rateLimiters")
const { notFound, errorHandler } = require("./middleware/errorHandler")
const v1Routes = require("./routes/v1")

const app = express()

// Behind a reverse proxy (nginx, Azure, ...) set TRUST_PROXY=1 so rate limiting sees the real client IP.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY)

// The browser (Next.js origin) calls this API cross-origin, so allow cross-origin reads of responses.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"))

app.use(
  cors({
    // Exact allow-list (never "*" together with credentials). Requests WITHOUT an Origin header
    // (Next.js server -> Express, curl, Postman) are not browser requests and are let through.
    origin: (origin, callback) => callback(null, !origin || env.CLIENT_ORIGINS.includes(origin)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
)

app.use(cookieParser())
app.use(express.json({ limit: "1mb" }))

app.get(API_PATHS.HEALTH, async (req, res) => {
  try {
    await getDataProvider().database.healthCheck()
    res.json({ status: "ok", database: "up" })
  } catch {
    console.error(`Database health check failed for ${env.DB_PROVIDER}.`)
    res.status(503).json({
      status: "degraded",
      database: "down",
      provider: env.DB_PROVIDER,
    })
  }
})

app.use(API_PATHS.BASE, apiLimiter)
app.use(API_PATHS.V1, v1Routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
