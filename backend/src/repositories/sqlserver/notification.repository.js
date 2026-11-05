const { prisma } = require("../../config/prisma")
const { parseId } = require("../../utils/ids")

const createOnce = async (input) => {
  const userID = parseId(input.userId)
  try {
    const notification = await prisma.notification.create({
      data: {
        userID,
        dedupeKey: input.dedupeKey,
        event: input.event,
        title: input.title,
        message: input.message,
        requestID: input.requestId ? BigInt(input.requestId) : null,
        createdAt: new Date(),
      },
    })
    return { notification, created: true }
  } catch (error) {
    if (error.code !== "P2002") throw error
    const notification = await prisma.notification.findUniqueOrThrow({
      where: { userID_dedupeKey: { userID, dedupeKey: input.dedupeKey } },
    })
    return { notification, created: false }
  }
}

const listForUser = (userId, { unreadOnly, take }) =>
  prisma.notification.findMany({
    where: {
      userID: parseId(userId),
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { notificationID: "desc" }],
    take,
  })

const markRead = async (userId, notificationId) => {
  await prisma.notification.updateMany({
    where: {
      notificationID: notificationId,
      userID: parseId(userId),
      readAt: null,
    },
    data: { readAt: new Date() },
  })
  return prisma.notification.findFirst({
    where: { notificationID: notificationId, userID: parseId(userId) },
  })
}

module.exports = { createOnce, listForUser, markRead }
