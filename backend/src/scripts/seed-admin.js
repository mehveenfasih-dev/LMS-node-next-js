const { env } = require("../config/env")
const { getDataProvider } = require("../providers")

async function seedAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim()
  const password = process.env.INITIAL_ADMIN_PASSWORD
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Library Admin"
  if (!email || !password) {
    throw new Error("Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD before seeding the administrator.")
  }

  const database = getDataProvider().database
  await database.connect()
  try {
    const admin = await getDataProvider().repositories.users.createAdmin({ name, email, password })
    console.log(`Created administrator account for ${admin.email} using ${env.DB_PROVIDER}.`)
  } finally {
    await database.disconnect()
  }
}

seedAdmin().catch((error) => {
  console.error("Failed to seed the administrator:", error)
  process.exitCode = 1
})
