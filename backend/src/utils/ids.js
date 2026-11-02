// Same rules as parseId() in the Next.js repository: positive 32-bit integers.
const ApiError = require("./ApiError")

const parseId = (value) => {
  const text = String(value)
  if (!/^[1-9]\d*$/.test(text)) throw ApiError.badRequest("The requested record ID is invalid.")
  const parsed = Number(text)
  if (!Number.isSafeInteger(parsed) || parsed > 2_147_483_647) throw ApiError.badRequest("The requested record ID is invalid.")
  return parsed
}

// BorrowRequests.requestID is a BIGINT -> BigInt in Prisma
const parseRequestId = (value) => {
  const text = String(value)
  if (!/^[1-9]\d*$/.test(text)) throw ApiError.badRequest("The request ID is invalid.")
  return BigInt(text)
}

module.exports = { parseId, parseRequestId }
