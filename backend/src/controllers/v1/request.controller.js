const requestService = require("../../services/request.service")

const list = async (req, res) => res.json(await requestService.list(req.user, req.validated.query))
const create = async (req, res) => res.status(201).json(await requestService.create(req.user, req.body.bookId))
const setStatus = async (req, res) =>
  res.json(await requestService.setStatus(req.validated.params.id, req.body.status))

module.exports = { list, create, setStatus }
