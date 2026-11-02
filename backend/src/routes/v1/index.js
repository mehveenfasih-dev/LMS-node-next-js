const { Router } = require("express")
const { ROUTES } = require("../../config/routes")

const router = Router()

router.use(ROUTES.AUTH.PREFIX, require("./auth.routes"))
router.use(ROUTES.USERS.PREFIX, require("./user.routes"))
router.use(ROUTES.BOOKS.PREFIX, require("./book.routes"))
router.use(ROUTES.REQUESTS.PREFIX, require("./request.routes"))
router.use(ROUTES.REPORTS.PREFIX, require("./report.routes"))

module.exports = router
