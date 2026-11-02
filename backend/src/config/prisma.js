// One PrismaClient for the whole process. Same schema + same database as the Next.js app.
const { env } = require("./env") // make sure .env is loaded before Prisma reads DATABASE_URL
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

module.exports = { prisma }
