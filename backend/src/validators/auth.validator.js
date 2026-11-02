// Mirrors features/auth/schemas.ts in the Next.js app.
const { z } = require("zod")

const registerSchema = z.object({
  name: z.string("Name is required").trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Please enter a valid email address").trim().toLowerCase().max(254),
  password: z.string("Password is required").min(8, "Password must be at least 8 characters").max(128),
  // no `role` / `active`: Zod strips unknown keys, so clients cannot set them (mass-assignment defence)
})

const loginSchema = z.object({
  email: z.string("Email is required").trim().toLowerCase().min(1, "Email is required"),
  password: z.string("Password is required").min(1, "Password is required"),
})

const googleSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  name: z.string().trim().min(1).max(150),
})

module.exports = { registerSchema, loginSchema, googleSchema }
