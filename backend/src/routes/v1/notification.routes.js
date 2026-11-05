const { Router } = require("express")
const controller = require("../../controllers/v1/notification.controller")
const { validate } = require("../../middleware/validate")
const { authenticate } = require("../../middleware/authenticate")
const {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} = require("../../validators/notification.validator")
const { ROUTES } = require("../../config/routes")

const router = Router()
router.use(authenticate)
router.get("/", validate({ query: listNotificationsQuerySchema }), controller.list)
router.patch(
  ROUTES.NOTIFICATIONS.MARK_READ,
  validate({ params: notificationIdParamSchema }),
  controller.markRead,
)

module.exports = router
