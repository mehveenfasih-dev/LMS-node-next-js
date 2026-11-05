const { z } = require("zod")

const requestSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/),
  bookId: z.string().regex(/^[1-9]\d*$/),
  bookTitle: z.string().max(255),
  userId: z.string().regex(/^[1-9]\d*$/),
  userName: z.string().max(150),
  userEmail: z.string().email().max(254),
  status: z.enum(["pending", "approved", "rejected", "returned", "overdue", "cancelled"]),
  requestedAt: z.string().datetime(),
  dueAt: z.string().datetime().nullable(),
})

const notificationSchema = z.object({
  id: z.string().uuid(),
  event: z.enum(["request:created", "request:approved", "request:rejected", "request:returned"]),
  title: z.string().max(150),
  message: z.string().max(500),
  requestId: z.string().regex(/^[1-9]\d*$/),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
})

const requestEventSchema = z.object({
  event: z.enum(["request:created", "request:approved", "request:rejected", "request:returned"]),
  request: requestSchema,
  notifications: z.array(z.object({
    userId: z.string().regex(/^[1-9]\d*$/),
    notification: notificationSchema,
  })).max(500),
})

const publishEventSchema = z.discriminatedUnion("event", [
  requestEventSchema,
  z.object({
    event: z.literal("user:deactivated"),
    userId: z.string().regex(/^[1-9]\d*$/),
  }),
])

module.exports = { publishEventSchema }
