const { randomUUID } = require("node:crypto")
const { getCollection } = require("../../providers/mongodb/database")
const { parseId } = require("../../utils/ids")

const notifications = () => getCollection("notifications")

const createOnce = async (input) => {
  const userID = parseId(input.userId)
  const notification = {
    notificationID: randomUUID(),
    userID,
    dedupeKey: input.dedupeKey,
    event: input.event,
    title: input.title,
    message: input.message,
    requestID: input.requestId ?? null,
    createdAt: new Date(),
    readAt: null,
  }
  await notifications().updateOne(
    { userID, dedupeKey: input.dedupeKey },
    { $setOnInsert: notification },
    { upsert: true },
  )
  const stored = await notifications().findOne({ userID, dedupeKey: input.dedupeKey })
  if (!stored) throw new Error("The notification could not be loaded after persistence.")
  return { notification: stored, created: result.upsertedCount === 1 }
}

const listForUser = (userId, { unreadOnly, take }) =>
  notifications()
    .find({ userID: parseId(userId), ...(unreadOnly ? { readAt: null } : {}) })
    .sort({ createdAt: -1, notificationID: -1 })
    .limit(take)
    .toArray()

const markRead = async (userId, notificationId) => {
  const result = await notifications().updateOne(
    { notificationID: notificationId, userID: parseId(userId), readAt: null },
    { $set: { readAt: new Date() } },
  )
  return notifications().findOne({ notificationID: notificationId, userID: parseId(userId) })
}

module.exports = { createOnce, listForUser, markRead }
