const { parseId, parseRequestId } = require("../../utils/ids")
const ApiError = require("../../utils/ApiError")
const { getCollection } = require("../../providers/mongodb/database")

const nextId = async (sequence, session) => {
  const counter = await getCollection("counters").findOneAndUpdate(
    { _id: sequence },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after", includeResultMetadata: false, session },
  )
  const maximum = sequence === "requestID" ? Number.MAX_SAFE_INTEGER : 2_147_483_647
  if (!counter || counter.value > maximum) {
    throw new Error(`The MongoDB ${sequence} sequence exceeded the supported ID range.`)
  }
  return counter.value
}

const parseMongoId = (value) => parseId(value)

const parseMongoRequestId = (value) => {
  const id = parseRequestId(value)
  if (id > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw ApiError.badRequest("The request ID is invalid.")
  }
  return Number(id)
}

const normalizeEmail = (email) => String(email).trim().toLowerCase()

const isDuplicateKey = (error) => error?.code === 11000

module.exports = { nextId, parseMongoId, parseMongoRequestId, normalizeEmail, isDuplicateKey }
