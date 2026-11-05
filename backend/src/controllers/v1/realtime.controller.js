const realtime = require("../../realtime/socket")

const publish = (req, res) => {
  const { event, request, notifications } = req.body
  if (event === "user:deactivated") {
    realtime.disconnectUser(req.body.userId)
    return res.status(204).end()
  }
  for (const item of notifications) {
    realtime.emitToUser(item.userId, "notification:new", item.notification)
  }
  if (event === "request:created") {
    realtime.emitToAdmins("request:created", request)
  } else {
    realtime.emitToUser(request.userId, event, request)
  }
  res.status(204).end()
}

module.exports = { publish }
