const { getDatabaseProvider } = require("../config/db-provider")

let activeProvider
const repositoryContracts = {
  books: ["list", "findById", "save", "remove"],
  users: ["findByEmail", "findById", "list", "createMember", "findOrCreateGoogle", "setActive"],
  requests: ["list", "findById", "create", "changeStatus"],
  reports: ["summary", "monthly", "categories"],
}

function validateProvider(provider, providerName) {
  for (const method of ["connect", "disconnect", "healthCheck"]) {
    if (typeof provider.database?.[method] !== "function") {
      throw new Error(`The ${providerName} provider is missing database method "${method}".`)
    }
  }

  for (const [repositoryName, methods] of Object.entries(repositoryContracts)) {
    for (const method of methods) {
      if (typeof provider.repositories?.[repositoryName]?.[method] !== "function") {
        throw new Error(
          `The ${providerName} provider is missing repository method "${repositoryName}.${method}".`,
        )
      }
    }
  }
}

function getDataProvider() {
  if (activeProvider) return activeProvider

  const providerName = getDatabaseProvider()
  if (providerName === "sqlserver") {
    const provider = require("./sqlserver")
    validateProvider(provider, providerName)
    activeProvider = provider
    return activeProvider
  }

  throw new Error(
    `DB_PROVIDER="${providerName}" is recognized but not implemented yet. ` +
      "Add a provider adapter with the database lifecycle and repository contracts before enabling it.",
  )
}

module.exports = { getDataProvider }
