const { randomBytes } = require("node:crypto")
const { prisma } = require("../../config/prisma")
const ApiError = require("../../utils/ApiError")
const { parseId } = require("../../utils/ids")
const { hashPassword } = require("../../utils/password")

const include = { role: true }
const normalizeEmail = (email) => String(email).trim().toLowerCase()

const getRoleId = async (roleName) => {
  const role = await prisma.role.findUnique({ where: { roleName } })
  if (!role) {
    throw new Error('Database roles are not initialized. Run "npm run db:seed" in the Next.js project.')
  }
  return role.roleID
}

const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email: normalizeEmail(email) }, include })

const findById = (id) => prisma.user.findUnique({ where: { userID: parseId(id) }, include })

const list = () => prisma.user.findMany({ include, orderBy: { createdAt: "desc" } })

const createWithRole = async ({ name, email, password }, roleName) => {
  const roleID = await getRoleId(roleName)
  try {
    return await prisma.user.create({
      data: {
        fullName: name.trim(),
        email: normalizeEmail(email),
        passwordHash: await hashPassword(password),
        roleID,
      },
      include,
    })
  } catch (error) {
    if (error.code === "P2002") {
      throw ApiError.conflict("An account with this email already exists.")
    }
    throw error
  }
}

const createMember = (input) => createWithRole(input, "member")
const createAdmin = (input) => createWithRole(input, "admin")

const findOrCreateGoogle = async ({ name, email }) => {
  const normalized = normalizeEmail(email)
  const roleID = await getRoleId("member")
  return prisma.user.upsert({
    where: { email: normalized },
    update: {},
    create: {
      fullName: name.trim(),
      email: normalized,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      roleID,
    },
    include,
  })
}

const setActive = async (id, active) => {
  try {
    return await prisma.user.update({
      where: { userID: parseId(id) },
      data: { isActive: active },
      include,
    })
  } catch (error) {
    if (error.code === "P2025") return null
    throw error
  }
}

module.exports = { findByEmail, findById, list, createMember, createAdmin, findOrCreateGoogle, setActive }
