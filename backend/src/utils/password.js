// MUST stay byte-compatible with the Next.js app (features/users/drivers/prisma.ts):
//   "<32 hex salt>:<128 hex scrypt digest>", scrypt(password, saltString, 64)
// so a user created by either app can sign in through the other one.
const { randomBytes, scrypt: nodeScrypt, timingSafeEqual } = require("node:crypto")
const { promisify } = require("node:util")

const scrypt = promisify(nodeScrypt)
const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex")
  const digest = await scrypt(password, salt, 64)
  return `${salt}:${digest.toString("hex")}`
}

// Always does the same amount of work, even for unknown users (no timing side channel).
const verifyPassword = async (password, storedHash) => {
  const [salt, hex] = (storedHash || DUMMY_HASH).split(":")
  if (!salt || !hex || !/^[a-f\d]+$/i.test(hex)) throw new Error("Stored password hash is invalid.")
  const expected = Buffer.from(hex, "hex")
  const actual = await scrypt(password, salt, expected.length)
  return timingSafeEqual(expected, actual) && Boolean(storedHash)
}

module.exports = { hashPassword, verifyPassword }
