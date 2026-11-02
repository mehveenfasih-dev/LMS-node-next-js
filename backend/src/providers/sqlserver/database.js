const { prisma } = require("../../config/prisma")

async function connect() {
  await prisma.$connect()
}

async function disconnect() {
  await prisma.$disconnect()
}

async function healthCheck() {
  await prisma.$queryRaw`SELECT 1`
}

module.exports = { connect, disconnect, healthCheck }
