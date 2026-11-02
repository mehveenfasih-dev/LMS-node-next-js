const { Router } = require("express")
const controller = require("../../controllers/v1/user.controller")
const { validate } = require("../../middleware/validate")
const { authenticate, authorize } = require("../../middleware/authenticate")
const { ROLES } = require("../../config/constants")
const { ROUTES } = require("../../config/routes")
const { userIdParamSchema, userActiveSchema } = require("../../validators/user.validator")

const router = Router()
router.use(authenticate, authorize(ROLES.ADMIN))

router.get(ROUTES.COLLECTION, controller.list)
router.patch(ROUTES.BY_ID, validate({ params: userIdParamSchema, body: userActiveSchema }), controller.setActive)

module.exports = router
