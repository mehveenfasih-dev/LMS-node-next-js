const reportService = require("../../services/report.service")

const summary = async (req, res) => res.json(await reportService.summary())
const monthly = async (req, res) => res.json(await reportService.monthly(req.validated.query.months))
const categories = async (req, res) => res.json(await reportService.categories())

module.exports = { summary, monthly, categories }
