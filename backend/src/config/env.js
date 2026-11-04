const path = require("node:path")
require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true })
const { getDatabaseProvider } = require("./db-provider")

const num = (name, fallback) => (process.env[name] === undefined ? fallback : Number(process.env[name]))
const list = (value) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean)

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: num("PORT", 5000),
  CLIENT_ORIGINS: list(process.env.CLIENT_ORIGIN || "http://localhost:3000"),
  DB_PROVIDER: getDatabaseProvider(),
  DATABASE_URL: process.env.DATABASE_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DATABASE: process.env.MONGODB_DATABASE,
  MONGODB_MAX_POOL_SIZE: num("MONGODB_MAX_POOL_SIZE", 10),
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_DAYS: num("SESSION_DAYS", 7),
  LOAN_PERIOD_DAYS: num("LOAN_PERIOD_DAYS", 14),
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || "",
  NEXT_REVALIDATE_URL: (process.env.NEXT_REVALIDATE_URL || "").replace(/\/$/, ""),
  REVALIDATION_SECRET_TOKEN: process.env.REVALIDATION_SECRET_TOKEN || "",
}

const missing = ["JWT_SECRET"]
if (env.DB_PROVIDER === "sqlserver") missing.push("DATABASE_URL")
if (env.DB_PROVIDER === "mongodb") missing.push("MONGODB_URI")
const missingValues = missing.filter((key) => !env[key])
if (missingValues.length) {
  throw new Error(`Missing required environment variable(s): ${missingValues.join(", ")}`)
}
if (
  env.DB_PROVIDER === "mongodb" &&
  (!Number.isInteger(env.MONGODB_MAX_POOL_SIZE) || env.MONGODB_MAX_POOL_SIZE < 1)
) {
  throw new Error("MONGODB_MAX_POOL_SIZE must be a positive integer.")
}

module.exports = { env }
