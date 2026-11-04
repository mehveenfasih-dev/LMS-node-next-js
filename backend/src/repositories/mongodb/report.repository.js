const { getCollection } = require("../../providers/mongodb/database")

const summary = async () => {
  const [bookTitles, activeMembers, pendingRequests, availability] = await Promise.all([
    getCollection("books").countDocuments(),
    getCollection("users").countDocuments({ isActive: true, "role.roleName": "member" }),
    getCollection("requests").countDocuments({ status: "PENDING" }),
    getCollection("books")
      .aggregate([
        { $unwind: "$bookCopies" },
        { $match: { "bookCopies.copyStatus": { $in: ["AVAILABLE", "PENDING_REQUEST"] } } },
        { $count: "availableCopies" },
      ])
      .toArray(),
  ])
  return {
    bookTitles,
    availableCopies: availability[0]?.availableCopies ?? 0,
    activeMembers,
    pendingRequests,
  }
}

const monthly = async (months = 6) => {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  start.setMonth(start.getMonth() - (months - 1))

  const rows = await getCollection("requests")
    .aggregate([
      { $match: { requestedAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$requestedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray()
  return rows.map((row) => ({ month: row._id, count: row.count }))
}

const categories = async () => {
  const rows = await getCollection("books")
    .aggregate([
      { $unwind: "$bookCategories" },
      { $group: { _id: "$bookCategories.category.categoryName", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray()
  return rows.map((row) => ({ category: row._id, count: row.count }))
}

module.exports = { summary, monthly, categories }
