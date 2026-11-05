const { Router } = require("express")
const controller = require("../../controllers/v1/realtime.controller")
const { requireInternalKey } = require("../../middleware/authenticate")
const { validate } = require("../../middleware/validate")
const { publishEventSchema } = require("../../validators/realtime.validator")
const { ROUTES } = require("../../config/routes")

const router = Router()
router.post(ROUTES.REALTIME.EVENTS, requireInternalKey, validate({ body: publishEventSchema }), controller.publish)

module.exports = router
