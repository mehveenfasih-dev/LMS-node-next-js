const { env } = require("../../config/env")
const ApiError = require("../../utils/ApiError")
const { getCollection, withTransaction } = require("../../providers/mongodb/database")
const { isDuplicateKey, nextId, parseMongoId, parseMongoRequestId } = require("./common")

const requests = () => getCollection("requests")
const books = () => getCollection("books")
const users = () => getCollection("users")

const hydrate = (request) => ({
  ...request,
  user: {
    userID: request.userID,
    fullName: request.userName,
    email: request.userEmail,
  },
  copy: {
    book: {
      bookID: request.bookID,
      title: request.bookTitle,
    },
  },
})

const list = async ({ userId, take } = {}) => {
  const cursor = requests()
    .find(userId ? { userID: parseMongoId(userId) } : {})
    .sort({ requestedAt: -1, requestID: -1 })
  if (take) cursor.limit(take)
  return (await cursor.toArray()).map(hydrate)
}

const findById = async (id) => {
  const request = await requests().findOne({ requestID: parseMongoRequestId(id) })
  return request ? hydrate(request) : null
}

const create = async (bookId, userId) => {
  const bookID = parseMongoId(bookId)
  const userID = parseMongoId(userId)

  try {
    return await withTransaction(async (session) => {
      const user = await users().findOne({ userID }, { session })
      if (!user) throw ApiError.notFound("Member not found.")

      const book = await books().findOne({ bookID }, { session })
      if (!book) throw ApiError.notFound("Book not found.")

      const active = await requests().findOne(
        { userID, bookID, status: { $in: ["PENDING", "APPROVED"] } },
        { session, projection: { _id: 1 } },
      )
      if (active) throw ApiError.conflict("You already have an active request for this book.")

      const copy = book.bookCopies.find((candidate) => candidate.copyStatus === "AVAILABLE")
      if (!copy) throw ApiError.conflict("This book is currently unavailable.")

      const reserved = await books().updateOne(
        {
          _id: book._id,
          bookCopies: { $elemMatch: { copyID: copy.copyID, copyStatus: "AVAILABLE" } },
        },
        { $set: { "bookCopies.$.copyStatus": "PENDING_REQUEST" } },
        { session },
      )
      if (reserved.modifiedCount !== 1) {
        throw ApiError.conflict("This book is currently unavailable.")
      }

      const request = {
        requestID: await nextId("requestID", session),
        copyID: copy.copyID,
        bookID,
        bookTitle: book.title,
        userID,
        userName: user.fullName,
        userEmail: user.email,
        status: "PENDING",
        requestedAt: new Date(),
        approvedAt: null,
        dueAt: null,
        returnedAt: null,
      }
      await requests().insertOne(request, { session })
      return hydrate(request)
    })
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw ApiError.conflict("You already have an active request for this book.")
    }
    throw error
  }
}

const changeStatus = async (id, status) => {
  const requestID = parseMongoRequestId(id)

  const updated = await withTransaction(async (session) => {
    const current = await requests().findOne({ requestID }, { session })
    if (!current) throw ApiError.notFound("The borrowing request could not be found.")

    let copyStatus
    let requestUpdate
    if (status === "approved" && current.status === "PENDING") {
      copyStatus = "ON_LOAN"
      requestUpdate = {
        status: "APPROVED",
        approvedAt: new Date(),
        dueAt: new Date(Date.now() + env.LOAN_PERIOD_DAYS * 86_400_000),
      }
    } else if (status === "rejected" && current.status === "PENDING") {
      copyStatus = "AVAILABLE"
      requestUpdate = { status: "REJECTED" }
    } else if (status === "returned" && current.status === "APPROVED") {
      copyStatus = "AVAILABLE"
      requestUpdate = { status: "RETURNED", returnedAt: new Date() }
    } else {
      throw ApiError.conflict("This borrowing request can no longer be updated.")
    }

    const expectedCopyStatus = current.status === "PENDING" ? "PENDING_REQUEST" : "ON_LOAN"
    const copyUpdated = await books().updateOne(
      {
        bookID: current.bookID,
        bookCopies: { $elemMatch: { copyID: current.copyID, copyStatus: expectedCopyStatus } },
      },
      { $set: { "bookCopies.$.copyStatus": copyStatus } },
      { session },
    )
    if (copyUpdated.modifiedCount !== 1) {
      throw ApiError.conflict("The book copy is no longer available for this request.")
    }

    const result = await requests().findOneAndUpdate(
      { _id: current._id, status: current.status },
      { $set: requestUpdate },
      { returnDocument: "after", includeResultMetadata: false, session },
    )
    if (!result) throw ApiError.conflict("This borrowing request can no longer be updated.")
    return result
  })

  return hydrate(updated)
}

module.exports = { list, findById, create, changeStatus }
