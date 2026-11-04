const { randomBytes } = require("node:crypto")
const ApiError = require("../../utils/ApiError")
const { hashPassword } = require("../../utils/password")
const { getCollection } = require("../../providers/mongodb/database")
const { isDuplicateKey, nextId, normalizeEmail, parseMongoId } = require("./common")

const users = () => getCollection("users")

const findByEmail = (email) => users().findOne({ email: normalizeEmail(email) })

const findById = (id) => users().findOne({ userID: parseMongoId(id) })

const list = () => users().find({}).sort({ createdAt: -1 }).toArray()

const createWithRole = async ({ name, email, password }, roleName) => {
  const user = {
    userID: await nextId("userID"),
    role: { roleName },
    fullName: name.trim(),
    email: normalizeEmail(email),
    passwordHash: await hashPassword(password),
    isActive: true,
    createdAt: new Date(),
  }
  try {
    await users().insertOne(user)
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw ApiError.conflict("An account with this email already exists.")
    }
    throw error
  }
  return user
}

const createMember = (input) => createWithRole(input, "member")
const createAdmin = (input) => createWithRole(input, "admin")

const findOrCreateGoogle = async ({ name, email }) => {
  const normalized = normalizeEmail(email)
  const existing = await findByEmail(normalized)
  if (existing) return existing

  const user = {
    userID: await nextId("userID"),
    role: { roleName: "member" },
    fullName: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(randomBytes(32).toString("hex")),
    isActive: true,
    createdAt: new Date(),
  }
  try {
    await users().insertOne(user)
    return user
  } catch (error) {
    if (!isDuplicateKey(error)) throw error
    const winner = await findByEmail(normalized)
    if (!winner) throw error
    return winner
  }
}

const setActive = async (id, active) =>
  users().findOneAndUpdate(
    { userID: parseMongoId(id) },
    { $set: { isActive: active } },
    { returnDocument: "after", includeResultMetadata: false },
  )

module.exports = { findByEmail, findById, list, createMember, createAdmin, findOrCreateGoogle, setActive }
