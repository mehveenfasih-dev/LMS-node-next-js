const { ROLES } = require("../config/constants")
const requestRepository = require("../repositories/request.repository")
const { toBorrowRequest } = require("../utils/serializers")
const { notifyFrontend } = require("../utils/notifyFrontend")
const notificationService = require("./notification.service")

// Members only ever see their own requests; admins can see all (optionally filtered by ?userId=).
const list = async (actor, { userId, take }) => {
  const scope = actor.role === ROLES.ADMIN ? userId : actor.id
  return { items: (await requestRepository.list({ userId: scope, take })).map(toBorrowRequest) }
}

const create = async (actor, bookId) => {
  const request = toBorrowRequest(await requestRepository.create(bookId, actor.id))
  notifyFrontend()
  await notificationService.requestCreated(request)
  return request
}

const setStatus = async (id, status) => {
  const request = toBorrowRequest(await requestRepository.changeStatus(id, status))
  notifyFrontend() // approving / returning changes availableCopies
  await notificationService.requestStatusChanged(request)
  return request
}

module.exports = { list, create, setStatus }
