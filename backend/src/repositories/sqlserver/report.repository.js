const { prisma } = require("../../config/prisma")

const summary = async () => {
  const [bookTitles, availableCopies, activeMembers, pendingRequests] = await Promise.all([
    prisma.book.count(),
    prisma.bookCopy.count({ where: { copyStatus: "AVAILABLE" } }),
    prisma.user.count({ where: { isActive: true, role: { roleName: "member" } } }),
    prisma.borrowRequest.count({ where: { status: "PENDING" } }),
  ])
  return { bookTitles, availableCopies, activeMembers, pendingRequests }
}

const monthly = async (months = 6) => {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  start.setMonth(start.getMonth() - (months - 1))

  const rows = await prisma.$queryRaw`SELECT CONVERT(char(7), [requestedAt], 126) AS [monthKey],
           COUNT_BIG(*) AS [requestCount]
    FROM [BorrowRequests]
    WHERE [requestedAt] >= ${start}
    GROUP BY YEAR([requestedAt]), MONTH([requestedAt])
    ORDER BY YEAR([requestedAt]), MONTH([requestedAt])`
  return rows.map((row) => ({ month: row.monthKey, count: Number(row.requestCount) }))
}

const categories = async () => {
  const counts = await prisma.bookCategory.groupBy({
    by: ["categoryID"],
    _count: { bookID: true },
    having: { bookID: { _count: { gt: 0 } } },
    orderBy: { _count: { bookID: "desc" } },
  })
  const rows = await prisma.category.findMany({
    where: { categoryID: { in: counts.map((category) => category.categoryID) } },
    select: { categoryID: true, categoryName: true },
  })
  const names = new Map(rows.map((category) => [category.categoryID, category.categoryName]))
  return counts.map((category) => ({
    category: names.get(category.categoryID) ?? "Unknown",
    count: category._count.bookID,
  }))
}

module.exports = { summary, monthly, categories }
