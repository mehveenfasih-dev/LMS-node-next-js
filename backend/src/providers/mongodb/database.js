const { MongoClient } = require("mongodb")
const { env } = require("../../config/env")

let client
let db

const getCollection = (name) => {
  if (!db) throw new Error("MongoDB is not connected.")
  return db.collection(name)
}

async function connect() {
  if (db) return

  const uri = env.MONGODB_URI
  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.")
  }

  const parsedUri = new URL(uri)
  const databaseName = env.MONGODB_DATABASE || parsedUri.pathname.replace(/^\/+|\/+$/g, "") || "lms"
  const nextClient = new MongoClient(uri, {
    appName: "lms-backend",
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
  })

  try {
    await nextClient.connect()
    const nextDb = nextClient.db(databaseName)
    const topology = await nextDb.admin().command({ hello: 1 })
    if (!topology.setName && topology.msg !== "isdbgrid") {
      throw new Error(
        "MongoDB transactions require a replica set or sharded cluster. Start local MongoDB with --replSet rs0.",
      )
    }
    await Promise.all([
      nextDb.collection("users").createIndex({ email: 1 }, { unique: true }),
      nextDb.collection("users").createIndex({ userID: 1 }, { unique: true }),
      nextDb.collection("books").createIndex({ bookID: 1 }, { unique: true }),
      nextDb.collection("books").createIndex({ "bookCopies.barcode": 1 }, { unique: true }),
      nextDb.collection("requests").createIndex({ requestID: 1 }, { unique: true }),
      nextDb.collection("requests").createIndex({ userID: 1, bookID: 1, status: 1 }),
      nextDb.collection("requests").createIndex({ requestedAt: -1, requestID: -1 }),
    ])
    client = nextClient
    db = nextDb
  } catch (error) {
    await nextClient.close()
    throw error
  }
}

async function disconnect() {
  const currentClient = client
  client = undefined
  db = undefined
  if (currentClient) await currentClient.close()
}

async function healthCheck() {
  if (!db) throw new Error("MongoDB is not connected.")
  await db.command({ ping: 1 })
}

async function withTransaction(operation) {
  if (!client || !db) throw new Error("MongoDB is not connected.")
  const session = client.startSession()
  let result
  try {
    await session.withTransaction(async () => {
      result = await operation(session)
    })
    return result
  } finally {
    await session.endSession()
  }
}

module.exports = { connect, disconnect, healthCheck, getCollection, withTransaction }
