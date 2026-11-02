const SUPPORTED_PROVIDERS = ["sqlserver", "mongodb"];

function getDatabaseProvider() {
  const configuredProvider = (process.env.DB_PROVIDER || "sqlserver").trim().toLowerCase()
  const legacyAliases = { prisma: "sqlserver", mongo: "mongodb" }
  const provider = legacyAliases[configuredProvider] || configuredProvider

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(
      `Unsupported DB_PROVIDER "${provider}". Use: ${SUPPORTED_PROVIDERS.join(", ")}`,
    );
  }

  return provider;
}

module.exports = { getDatabaseProvider };
