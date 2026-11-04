const { randomUUID } = require("node:crypto")
const ApiError = require("../../utils/ApiError")
const { getCollection, withTransaction } = require("../../providers/mongodb/database")
const { nextId, parseMongoId } = require("./common")

const splitNames = (input) => [...new Set(String(input).split(",").map((name) => name.trim()).filter(Boolean))]
const books = () => getCollection("books")

const list = () => books().find({}).sort({ title: 1, bookID: 1 }).toArray()

const findById = (id) => books().findOne({ bookID: parseMongoId(id) })

const save = (input, id) =>
  withTransaction(async (session) => {
    const bookID = id ? parseMongoId(id) : await nextId("bookID", session)
    const existing = id ? await books().findOne({ bookID }, { session }) : null
    if (id && !existing) {
      throw ApiError.notFound("The book could not be found in the catalog.")
    }

    const copies = existing?.bookCopies ?? []
    const pending = copies.filter((copy) => copy.copyStatus === "PENDING_REQUEST")
    const protectedCopies = copies.filter(
      (copy) => copy.copyStatus !== "AVAILABLE" && copy.copyStatus !== "PENDING_REQUEST",
    )
    if (input.totalCopies < pending.length + protectedCopies.length) {
      throw ApiError.conflict(
        `At least ${pending.length + protectedCopies.length} copies are borrowed, reserved, lost, or damaged and cannot be removed.`,
      )
    }

    const available = copies.filter((copy) => copy.copyStatus === "AVAILABLE")
    const targetAvailable = input.totalCopies - pending.length - protectedCopies.length
    const updatedCopies = [...pending, ...protectedCopies, ...available.slice(0, targetAvailable)]
    while (updatedCopies.filter((copy) => copy.copyStatus === "AVAILABLE").length < targetAvailable) {
      const copyID = await nextId("copyID", session)
      updatedCopies.push({
        copyID,
        barcode: `BH-${bookID}-${randomUUID()}`,
        copyStatus: "AVAILABLE",
      })
    }

    const data = {
      bookID,
      title: input.title.trim(),
      ISBN: input.isbn.trim() || null,
      publishedYear: input.year,
      publisher: input.publisher.trim(),
      pages: input.pages,
      description: input.description.trim(),
      bookAuthors: splitNames(input.author).map((authorName, index) => ({
        authorOrder: index + 1,
        author: { authorName },
      })),
      bookCategories: splitNames(input.category).map((categoryName) => ({
        category: { categoryName },
      })),
      bookCopies: updatedCopies,
      createdAt: existing?.createdAt ?? new Date(),
    }

    if (!existing) {
      await books().insertOne(data, { session })
      return data
    }

    await books().replaceOne({ _id: existing._id }, data, { session })
    return data
  })

const remove = (id) =>
  withTransaction(async (session) => {
    const bookID = parseMongoId(id)
    const book = await books().findOne({ bookID }, { session, projection: { _id: 1 } })
    if (!book) throw ApiError.notFound("The book could not be found in the catalog.")
    if (await getCollection("requests").findOne({ bookID }, { session, projection: { _id: 1 } })) {
      throw ApiError.conflict(
        "This book has borrowing history and cannot be deleted. Keep the record to preserve the audit trail.",
      )
    }
    await books().deleteOne({ _id: book._id }, { session })
  })

module.exports = { list, findById, save, remove }
