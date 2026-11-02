// validate({ params, query, body }) -> Zod. body replaces req.body; params/query go to req.validated
// (Express 5: req.query is read-only).
const ApiError = require("../utils/ApiError")

const toFieldErrors = (issues) => {
  const errors = {}
  issues.forEach((issue) => {
    const key = issue.path.join(".") || "_"
    if (!errors[key]) errors[key] = issue.message
  })
  return errors
}

const validate = (schemas) => (req, res, next) => {
  req.validated = req.validated ?? {}
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue
    const result = schemas[part].safeParse(req[part] ?? {})
    if (!result.success) {
      const errors = toFieldErrors(result.error.issues)
      return next(ApiError.badRequest(Object.values(errors)[0] ?? "Validation failed.", errors))
    }
    if (part === "body") req.body = result.data
    else req.validated[part] = result.data
  }
  next()
}

module.exports = { validate }
