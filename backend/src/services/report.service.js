const reportRepository = require("../repositories/report.repository")

module.exports = {
  summary: () => reportRepository.summary(),
  monthly: async (months) => ({ items: await reportRepository.monthly(months) }),
  categories: async () => ({ items: await reportRepository.categories() }),
}
