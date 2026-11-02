const { Router } = require("express")
const controller = require("../../controllers/v1/request.controller")
const { validate } = require("../../middleware/validate")
const { authenticate, authorize } = require("../../middleware/authenticate")
const { ROLES } = require("../../config/constants")
const { ROUTES } = require("../../config/routes")
const {
  createRequestSchema,
  requestIdParamSchema,
  requestStatusSchema,
  listRequestsQuerySchema,
} = require("../../validators/request.validator")

const router = Router()
router.use(authenticate)

router.get(ROUTES.COLLECTION, validate({ query: listRequestsQuerySchema }), controller.list) // admin: all, member: own
router.post(ROUTES.COLLECTION, authorize(ROLES.MEMBER), validate({ body: createRequestSchema }), controller.create)
router.patch(
  ROUTES.BY_ID,
  authorize(ROLES.ADMIN),
  validate({ params: requestIdParamSchema, body: requestStatusSchema }),
  controller.setStatus,
)

module.exports = router
