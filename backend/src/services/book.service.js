const bookRepository = require("../repositories/book.repository")
const ApiError = require("../utils/ApiError")
const { toBook } = require("../utils/serializers")
const { notifyFrontend } = require("../utils/notifyFrontend")

const list = async () => ({ items: (await bookRepository.list()).map(toBook) })

const getById = async (id) => {
  const book = await bookRepository.findById(id)
  if (!book) throw ApiError.notFound("Book not found.")
  return toBook(book)
}

const save = async (input, id) => {
  const book = toBook(await bookRepository.save(input, id))
  notifyFrontend()
  return book
}

const remove = async (id) => {
  await bookRepository.remove(id)
  notifyFrontend()
}

module.exports = { list, getById, save, remove }
