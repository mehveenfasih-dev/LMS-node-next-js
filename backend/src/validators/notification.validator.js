const { z } = require("zod")

const listNotificationsQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
  take: z.coerce.number().int().min(1).max(100).default(50),
})

const notificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID."),
})

module.exports = { listNotificationsQuerySchema, notificationIdParamSchema }
