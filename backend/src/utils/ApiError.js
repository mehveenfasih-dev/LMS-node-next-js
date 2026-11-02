class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.errors = errors
  }
  static badRequest(message, errors) { return new ApiError(400, message, errors) }
  static unauthorized(message = "Authentication required.") { return new ApiError(401, message) }
  static forbidden(message = "You do not have permission to do that.") { return new ApiError(403, message) }
  static notFound(message = "Not found.") { return new ApiError(404, message) }
  static conflict(message) { return new ApiError(409, message) }
}

module.exports = ApiError
