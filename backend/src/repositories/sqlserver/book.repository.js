// SQL Server implementation of the book repository contract.
const { randomUUID } = require("node:crypto")
const { prisma } = require("../../config/prisma")
const ApiError = require("../../utils/ApiError")
const { parseId } = require("../../utils/ids")

const bookInclude = {
  bookAuthors: { include: { author: true }, orderBy: { authorOrder: "asc" } },
  bookCategories: { include: { category: true }, orderBy: { categoryID: "asc" } },
  bookCopies: { select: { copyStatus: true } },
}

const splitNames = (input) => [...new Set(String(input).split(",").map((name) => name.trim()).filter(Boolean))]

const list = () =>
  prisma.book.findMany({
    include: bookInclude,
    orderBy: [{ title: "asc" }, { bookID: "asc" }],
  })

const findById = (id) =>
  prisma.book.findUnique({ where: { bookID: parseId(id) }, include: bookInclude })

const saveCategories = async (tx, bookID, categoryInput) => {
  await tx.bookCategory.deleteMany({ where: { bookID } })
  for (const categoryName of splitNames(categoryInput)) {
    const category = await tx.category.upsert({
      where: { categoryName },
      update: {},
      create: { categoryName },
    })
    await tx.bookCategory.create({ data: { bookID, categoryID: category.categoryID } })
  }
}

const saveAuthors = async (tx, bookID, authorInput) => {
  await tx.bookAuthor.deleteMany({ where: { bookID } })
  for (const [index, authorName] of splitNames(authorInput).entries()) {
    const author =
      (await tx.author.findFirst({ where: { authorName } })) ??
      (await tx.author.create({ data: { authorName } }))
    await tx.bookAuthor.create({
      data: { bookID, authorID: author.authorID, authorOrder: index + 1 },
    })
  }
}

const save = (input, id) =>
  prisma.$transaction(async (tx) => {
    const bookID = id ? parseId(id) : undefined
    const existing = bookID
      ? await tx.book.findUnique({ where: { bookID }, include: { bookCopies: true } })
      : undefined
    if (bookID && !existing) {
      throw ApiError.notFound("The book could not be found in the catalog.")
    }

    const copies = existing?.bookCopies ?? []
    const nonAvailable = copies.filter((copy) => copy.copyStatus !== "AVAILABLE").length
    if (input.totalCopies < nonAvailable) {
      throw ApiError.conflict(
        `At least ${nonAvailable} copies are borrowed, lost, or damaged and cannot be removed.`,
      )
    }

    const data = {
      title: input.title.trim(),
      ISBN: input.isbn.trim() || null,
      publishedYear: input.year,
      publisher: input.publisher.trim(),
      pages: input.pages,
      description: input.description.trim(),
    }
    const book = existing
      ? await tx.book.update({ where: { bookID: existing.bookID }, data })
      : await tx.book.create({ data })

    await saveCategories(tx, book.bookID, input.category)
    await saveAuthors(tx, book.bookID, input.author)

    const available = copies.filter((copy) => copy.copyStatus === "AVAILABLE")
    const targetAvailable = input.totalCopies - nonAvailable
    if (targetAvailable > available.length) {
      await tx.bookCopy.createMany({
        data: Array.from({ length: targetAvailable - available.length }, () => ({
          bookID: book.bookID,
          barcode: `BH-${book.bookID}-${randomUUID()}`,
        })),
      })
    } else if (targetAvailable < available.length) {
      await tx.bookCopy.deleteMany({
        where: { copyID: { in: available.slice(targetAvailable).map((copy) => copy.copyID) } },
      })
    }

    return tx.book.findUniqueOrThrow({ where: { bookID: book.bookID }, include: bookInclude })
  })

const remove = (id) =>
  prisma.$transaction(async (tx) => {
    const bookID = parseId(id)
    const book = await tx.book.findUnique({
      where: { bookID },
      include: { bookCopies: { include: { _count: { select: { borrowRequests: true } } } } },
    })
    if (!book) throw ApiError.notFound("The book could not be found in the catalog.")
    if (book.bookCopies.some((copy) => copy._count.borrowRequests > 0)) {
      throw ApiError.conflict(
        "This book has borrowing history and cannot be deleted. Keep the record to preserve the audit trail.",
      )
    }
    await tx.bookCopy.deleteMany({ where: { bookID } })
    await tx.book.delete({ where: { bookID } })
  })

module.exports = { list, findById, save, remove }
