// Mirrors isBookInput() in features/library/http-validation.ts (Next.js).
const { z } = require("zod")

const text = (label, max) => z.string(`${label} is required`).trim().min(1, `${label} is required`).max(max)

const bookSchema = z.object({
  title: text("Title", 255),
  author: text("Author", 1000),
  isbn: z.string().trim().max(20),
  category: text("Category", 1000),
  year: z.number().int().min(-32768).max(32767),
  publisher: text("Publisher", 150),
  pages: z.number().int().positive(),
  description: z.string("Description is required").trim().min(1, "Description is required"),
  totalCopies: z.number().int().positive(),
})

const idParamSchema = z.object({ id: z.string().regex(/^[1-9]\d*$/, "Invalid ID") })

module.exports = { bookSchema, idParamSchema }
