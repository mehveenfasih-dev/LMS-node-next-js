const { env } = require("../config/env")
const ApiError = require("../utils/ApiError")

const notFound = (req, res, next) => next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found.`))

// Sends { message, error } - the Next.js client reads `message ?? error`, the old Next routes sent `error`.
const send = (res, status, message, extra = {}) => res.status(status).json({ message, error: message, ...extra })

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  if (err instanceof ApiError) return send(res, err.statusCode, err.message, err.errors && { errors: err.errors })
  if (err.type === "entity.parse.failed") return send(res, 400, "A valid JSON body is required.")
  if (err.type === "entity.too.large") return send(res, 413, "Request body is too large.")

  // Prisma: unique violation, missing row, serialization failure / deadlock (SERIALIZABLE transactions)
  if (err.code === "P2002") return send(res, 409, "That record already exists.")
  if (err.code === "P2025") return send(res, 404, "Record not found.")
  if (err.code === "P2034") return send(res, 409, "The library is busy. Please try again.")

  console.error(err)
  send(res, 500, env.NODE_ENV === "production" ? "Internal server error." : err.message)
}

module.exports = { notFound, errorHandler }
