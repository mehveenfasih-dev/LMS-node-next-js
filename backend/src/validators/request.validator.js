const { z } = require("zod")

// Who is asking comes from the token, never from the body.
const createRequestSchema = z.object({ bookId: z.string("bookId is required").regex(/^[1-9]\d*$/, "A valid book ID is required") })

const requestIdParamSchema = z.object({ id: z.string().regex(/^[1-9]\d*$/, "Invalid ID") })

const requestStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "returned"], "Status must be approved, rejected or returned"),
})

const listRequestsQuerySchema = z.object({
  userId: z.string().regex(/^[1-9]\d*$/).optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
})

module.exports = { createRequestSchema, requestIdParamSchema, requestStatusSchema, listRequestsQuerySchema }
