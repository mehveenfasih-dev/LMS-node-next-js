// Best effort: tell the Next.js app its cached catalog is stale (the Express API changed the DB
// behind Next's back). Never blocks or fails the API response.
const { env } = require("../config/env")

const notifyFrontend = () => {
  if (!env.NEXT_REVALIDATE_URL || !env.REVALIDATION_SECRET_TOKEN) return
  const url = `${env.NEXT_REVALIDATE_URL}/api/revalidate?secret=${encodeURIComponent(env.REVALIDATION_SECRET_TOKEN)}&tag=library-books&path=/catalog`
  fetch(url, { method: "POST", signal: AbortSignal.timeout(3000) }).catch((error) =>
    console.warn("Could not notify the Next.js app to revalidate:", error.message),
  )
}

module.exports = { notifyFrontend }
