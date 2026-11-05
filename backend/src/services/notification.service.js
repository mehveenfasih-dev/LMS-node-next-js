const { ROLES } = require("../config/constants")
const { getDataProvider } = require("../providers")
const realtime = require("../realtime/socket")

const EVENT_NAMES = {
  approved: "request:approved",
  rejected: "request:rejected",
  returned: "request:returned",
}

const toPublicNotification = (record) => ({
  id: String(record.notificationID),
  event: record.event,
  title: record.title,
  message: record.message,
  requestId: record.requestID == null ? null : String(record.requestID),
  createdAt: new Date(record.createdAt).toISOString(),
  readAt: record.readAt == null ? null : new Date(record.readAt).toISOString(),
})

const persistAndEmit = async (userId, request, event, title, message) => {
  try {
    const { notification, created } = await getDataProvider().repositories.notifications.createOnce({
      userId,
      dedupeKey: `${event}:${request.id}:${userId}`,
      event,
      title,
      message,
      requestId: request.id,
    })
    if (created) realtime.emitToUser(userId, "notification:new", toPublicNotification(notification))
    return notification
  } catch (error) {
    console.error(`Could not persist ${event} notification for user ${userId}:`, error)
    return null
  }
}

const requestCreated = async (request) => {
  try {
    const { users } = getDataProvider().repositories
    const admins = (await users.list()).filter(
      (user) => user.isActive && user.role?.roleName === ROLES.ADMIN,
    )
    const message = `${request.userName} requested “${request.bookTitle}”.`
    await Promise.all(
      admins.map((admin) =>
        persistAndEmit(admin.userID, request, "request:created", "New book request", message),
      ),
    )
  } catch (error) {
    console.error("Could not notify administrators about the new book request:", error)
  }
  realtime.emitToAdmins("request:created", request)
}

const requestStatusChanged = async (request) => {
  const event = EVENT_NAMES[request.status]
  if (!event) throw new Error(`Unsupported request notification status "${request.status}".`)
  const title = {
    approved: "Book request approved",
    rejected: "Book request rejected",
    returned: "Book returned",
  }[request.status]
  const message = {
    approved: `Your request for “${request.bookTitle}” was approved.`,
    rejected: `Your request for “${request.bookTitle}” was rejected.`,
    returned: `Your return of “${request.bookTitle}” was recorded.`,
  }[request.status]

  await persistAndEmit(request.userId, request, event, title, message)
  realtime.emitToUser(request.userId, event, request)
}

module.exports = {
  requestCreated,
  requestStatusChanged,
  toPublicNotification,
}
