const { z } = require("zod")

const userIdParamSchema = z.object({ id: z.string().regex(/^[1-9]\d*$/, "Invalid ID") })
const userActiveSchema = z.object({ active: z.boolean("The active field must be a boolean.") })

module.exports = { userIdParamSchema, userActiveSchema }
