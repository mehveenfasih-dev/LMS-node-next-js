const { z } = require("zod")

const monthlyQuerySchema = z.object({ months: z.coerce.number().int().min(1).max(24).default(6) })

module.exports = { monthlyQuerySchema }
