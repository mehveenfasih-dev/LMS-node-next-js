const { Router } = require("express")
const controller = require("../../controllers/v1/report.controller")
const { validate } = require("../../middleware/validate")
const { authenticate, authorize } = require("../../middleware/authenticate")
const { ROLES } = require("../../config/constants")
const { monthlyQuerySchema } = require("../../validators/report.validator")
const { ROUTES } = require("../../config/routes")

const router = Router()
router.use(authenticate, authorize(ROLES.ADMIN))

router.get(ROUTES.REPORTS.SUMMARY, controller.summary)
router.get(ROUTES.REPORTS.MONTHLY, validate({ query: monthlyQuerySchema }), controller.monthly)
router.get(ROUTES.REPORTS.CATEGORIES, controller.categories)

module.exports = router
