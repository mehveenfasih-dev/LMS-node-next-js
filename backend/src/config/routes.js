const API_PATHS = {
  HEALTH: "/api/health",
  BASE: "/api",
  V1: "/api/v1",
}

const ROUTES = {
  COLLECTION: "/",
  BY_ID: "/:id",
  AUTH: {
    PREFIX: "/auth",
    REGISTER: "/register",
    LOGIN: "/login",
    LOGOUT: "/logout",
    ME: "/me",
    GOOGLE: "/google",
    SOCKET_TICKET: "/socket-ticket",
  },
  USERS: { PREFIX: "/users" },
  BOOKS: { PREFIX: "/books" },
  REQUESTS: { PREFIX: "/requests" },
  NOTIFICATIONS: { PREFIX: "/notifications", MARK_READ: "/:id/read" },
  REALTIME: { PREFIX: "/realtime", EVENTS: "/events" },
  REPORTS: {
    PREFIX: "/reports",
    SUMMARY: "/summary",
    MONTHLY: "/monthly",
    CATEGORIES: "/categories",
  },
}

module.exports = { API_PATHS, ROUTES }
