const { Router } = require("express")
const controller = require("../../controllers/v1/auth.controller")
const { validate } = require("../../middleware/validate")
const { authenticate, requireInternalKey } = require("../../middleware/authenticate")
const { loginLimiter, loginSlowDown } = require("../../middleware/rateLimiters")
const { registerSchema, loginSchema, googleSchema } = require("../../validators/auth.validator")
const { ROUTES } = require("../../config/routes")

const router = Router()

router.post(ROUTES.AUTH.REGISTER, validate({ body: registerSchema }), controller.register)
router.post(ROUTES.AUTH.LOGIN, loginLimiter, loginSlowDown, validate({ body: loginSchema }), controller.login)
router.post(ROUTES.AUTH.LOGOUT, controller.logout)
router.get(ROUTES.AUTH.ME, authenticate, controller.me)
router.get(ROUTES.AUTH.SOCKET_TICKET, authenticate, controller.socketTicket)
router.post(ROUTES.AUTH.GOOGLE, requireInternalKey, validate({ body: googleSchema }), controller.google)

module.exports = router
