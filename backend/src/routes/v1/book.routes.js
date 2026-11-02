const { Router } = require("express")
const controller = require("../../controllers/v1/book.controller")
const { validate } = require("../../middleware/validate")
const { authenticate, authorize } = require("../../middleware/authenticate")
const { ROLES } = require("../../config/constants")
const { ROUTES } = require("../../config/routes")
const { bookSchema, idParamSchema } = require("../../validators/book.validator")

const router = Router()
const adminOnly = [authenticate, authorize(ROLES.ADMIN)]

// Public (guests can browse the catalog)
router.get(ROUTES.COLLECTION, controller.list)
router.get(ROUTES.BY_ID, validate({ params: idParamSchema }), controller.getById)

// Admin only
router.post(ROUTES.COLLECTION, adminOnly, validate({ body: bookSchema }), controller.create)
router.put(ROUTES.BY_ID, adminOnly, validate({ params: idParamSchema, body: bookSchema }), controller.update)
router.delete(ROUTES.BY_ID, adminOnly, validate({ params: idParamSchema }), controller.remove)

module.exports = router
