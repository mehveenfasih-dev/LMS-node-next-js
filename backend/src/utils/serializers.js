// API shapes == the TypeScript types in the Next.js app (features/library/types.ts).
const ApiError = require("./ApiError")

const toLibraryUser = (user) => {
  if (!user || typeof user !== "object") {
    throw new Error("Cannot serialize an empty user record.")
  }
  if (user.userID === undefined || user.userID === null) {
    throw new Error("The user record is missing its ID.")
  }
  const role = user.role?.roleName
  if (role !== "admin" && role !== "member") throw new Error(`Unsupported database role "${role}".`)
  const createdAt = new Date(user.createdAt)
  if (!Number.isFinite(createdAt.getTime())) {
    throw new Error("The user record has an invalid creation date.")
  }
  if (typeof user.fullName !== "string" || typeof user.email !== "string") {
    throw new Error("The user record is missing its name or email.")
  }
  return {
    id: String(user.userID),
    name: user.fullName.trim(),
    email: user.email,
    role,
    active: user.isActive,
    joinedAt: createdAt.toISOString().slice(0, 10),
  }
}

const toBook = (book) => {
  if (!book || !Array.isArray(book.bookAuthors) || !Array.isArray(book.bookCategories) || !Array.isArray(book.bookCopies)) {
    throw new Error("The book record is missing its related authors, categories, or copies.")
  }
  if (book.bookID === undefined || book.bookID === null) {
    throw new Error("The book record is missing its ID.")
  }
  return {
    id: String(book.bookID),
    isbn: book.ISBN ?? "",
    title: book.title,
    author: book.bookAuthors.map((entry) => entry?.author?.authorName ?? "").filter(Boolean).join(", "),
    category: book.bookCategories.map((entry) => entry?.category?.categoryName ?? "").filter(Boolean).join(", "),
    year: book.publishedYear ?? new Date().getFullYear(),
    publisher: book.publisher,
    pages: book.pages,
    description: book.description,
    totalCopies: book.bookCopies.length,
    availableCopies: book.bookCopies.filter(
      (copy) => copy?.copyStatus === "AVAILABLE" || copy?.copyStatus === "PENDING_REQUEST",
    ).length,
  }
}

const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
  CANCELLED: "cancelled",
}

const toBorrowRequest = (request) => {
  if (!request || !request.copy?.book || !request.user) {
    throw new Error("The borrowing request is missing its book or user relation.")
  }
  const mapped = STATUS[request.status]
  if (!mapped) throw ApiError.badRequest(`Unsupported borrowing request status "${request.status}".`)
  if (request.requestID === undefined || request.requestID === null) {
    throw new Error("The borrowing request is missing its ID.")
  }
  const dueAt = request.dueAt == null ? null : new Date(request.dueAt)
  if (dueAt && !Number.isFinite(dueAt.getTime())) {
    throw new Error("The borrowing request has an invalid due date.")
  }
  const requestedAt = new Date(request.requestedAt)
  if (!Number.isFinite(requestedAt.getTime())) {
    throw new Error("The borrowing request has an invalid requested date.")
  }
  const overdue = request.status === "APPROVED" && dueAt !== null && dueAt.getTime() < Date.now()
  return {
    id: String(request.requestID),
    bookId: String(request.copy.book.bookID),
    bookTitle: request.copy.book.title,
    userId: String(request.user.userID),
    userName: request.user.fullName,
    userEmail: request.user.email,
    status: overdue ? "overdue" : mapped,
    requestedAt: requestedAt.toISOString(),
    dueAt: dueAt ? dueAt.toISOString() : null,
  }
}

module.exports = { toLibraryUser, toBook, toBorrowRequest }
