const { getDataProvider } = require("../../providers")
const { toPublicNotification } = require("../../services/notification.service")

const list = async (req, res) => {
  const items = await getDataProvider().repositories.notifications.listForUser(req.user.id, req.validated.query)
  res.json({ items: items.map(toPublicNotification) })
}

const markRead = async (req, res) => {
  const notification = await getDataProvider().repositories.notifications.markRead(
    req.user.id,
    req.validated.params.id,
  )
  if (!notification) return res.status(404).json({ message: "Notification not found." })
  res.json(toPublicNotification(notification))
}

module.exports = { list, markRead }
