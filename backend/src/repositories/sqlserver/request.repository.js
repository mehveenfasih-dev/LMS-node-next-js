const { Prisma } = require("@prisma/client")
const { prisma } = require("../../config/prisma")
const { env } = require("../../config/env")
const ApiError = require("../../utils/ApiError")
const { parseId, parseRequestId } = require("../../utils/ids")

const include = {
  user: { select: { userID: true, fullName: true, email: true } },
  copy: { include: { book: { select: { bookID: true, title: true } } } },
}
const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }

const list = ({ userId, take } = {}) =>
  prisma.borrowRequest.findMany({
    where: userId ? { userID: parseId(userId) } : undefined,
    include,
    orderBy: [{ requestedAt: "desc" }, { requestID: "desc" }],
    take,
  })

const findById = (id) =>
  prisma.borrowRequest.findUnique({ where: { requestID: parseRequestId(id) }, include })

const create = async (bookId, userId) => {
  const bookID = parseId(bookId)
  const userID = parseId(userId)

  const requestID = await prisma.$transaction(async (tx) => {
    if (!(await tx.book.findUnique({ where: { bookID }, select: { bookID: true } }))) {
      throw ApiError.notFound("Book not found.")
    }
    const active = await tx.borrowRequest.findFirst({
      where: { userID, status: { in: ["PENDING", "APPROVED"] }, copy: { bookID } },
      select: { requestID: true },
    })
    if (active) throw ApiError.conflict("You already have an active request for this book.")

    const copy = await tx.bookCopy.findFirst({
      where: { bookID, copyStatus: "AVAILABLE", borrowRequests: { none: { status: "PENDING" } } },
      orderBy: { copyID: "asc" },
    })
    if (!copy) throw ApiError.conflict("This book is currently unavailable.")

    return (await tx.borrowRequest.create({ data: { copyID: copy.copyID, userID } })).requestID
  }, SERIALIZABLE)

  return prisma.borrowRequest.findUniqueOrThrow({ where: { requestID }, include })
}

const changeStatus = async (id, status) => {
  const requestID = parseRequestId(id)

  await prisma.$transaction(async (tx) => {
    const current = await tx.borrowRequest.findUnique({
      where: { requestID },
      include: { copy: true },
    })
    if (!current) throw ApiError.notFound("The borrowing request could not be found.")

    if (status === "approved" && current.status === "PENDING") {
      const updatedCopy = await tx.bookCopy.updateMany({
        where: { copyID: current.copyID, copyStatus: "AVAILABLE" },
        data: { copyStatus: "ON_LOAN" },
      })
      if (updatedCopy.count !== 1) {
        throw ApiError.conflict("No copies of this book are currently available.")
      }
      await tx.borrowRequest.update({
        where: { requestID },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          dueAt: new Date(Date.now() + env.LOAN_PERIOD_DAYS * 86_400_000),
        },
      })
      return
    }

    if (status === "rejected" && current.status === "PENDING") {
      await tx.borrowRequest.update({ where: { requestID }, data: { status: "REJECTED" } })
      return
    }

    if (status === "returned" && current.status === "APPROVED") {
      await tx.borrowRequest.update({
        where: { requestID },
        data: { status: "RETURNED", returnedAt: new Date() },
      })
      await tx.bookCopy.update({
        where: { copyID: current.copyID },
        data: { copyStatus: "AVAILABLE" },
      })
      return
    }

    throw ApiError.conflict("This borrowing request can no longer be updated.")
  }, SERIALIZABLE)

  return prisma.borrowRequest.findUniqueOrThrow({ where: { requestID }, include })
}

module.exports = { list, findById, create, changeStatus }
