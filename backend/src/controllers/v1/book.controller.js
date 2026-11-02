const bookService = require("../../services/book.service")

const list = async (req, res) => res.json(await bookService.list())
const getById = async (req, res) => res.json(await bookService.getById(req.validated.params.id))
const create = async (req, res) => res.status(201).json(await bookService.save(req.body))
const update = async (req, res) => res.json(await bookService.save(req.body, req.validated.params.id))

const remove = async (req, res) => {
  await bookService.remove(req.validated.params.id)
  res.status(204).send()
}

module.exports = { list, getById, create, update, remove }
