# Backend data providers

The Express backend owns data access. Services depend on the stable repository modules in
`src/repositories`; those modules resolve the configured provider and expose the same repository
contract regardless of the database implementation.

## Current provider

Set `DB_PROVIDER=sqlserver` in the backend environment. The SQL Server provider uses the existing
Prisma schema and connection string (`DATABASE_URL`). The frontend can continue calling the same
Express API in external backend mode; changing the backend database does not require changing API
routes or service code. Existing `DB_PROVIDER=prisma` and `DB_PROVIDER=mongo` values are normalized
to `sqlserver` and `mongodb` respectively for compatibility.

## Adding a provider

MongoDB is not implemented yet. `DB_PROVIDER=mongodb` is accepted as a known provider name but
fails at startup with an explicit “not implemented” error. Do not select it until its adapter is
ready.

To add MongoDB or another database:

1. Add a provider module under `src/providers/<provider>/` implementing `connect()`,
   `disconnect()`, and `healthCheck()`.
2. Add provider-specific repositories under `src/repositories/<provider>/`. Match the methods and
   return shapes of the SQL Server repositories; translate database records into the existing
   service-facing shape inside the adapter.
3. Export the repositories from the provider index and register the provider in
   `src/providers/index.js`.
4. Add and validate that provider's connection settings in `src/config/env.js`.
5. Add provider-specific integration tests for repository behavior, transactions, and the health
   check before enabling it in deployment configuration.

Keep database-specific queries, transactions, and ID conversion inside provider adapters. Services,
controllers, routes, and API response serializers should not import Prisma, Mongoose, or database
clients directly. Provider-specific IDs must be mapped to the established service/API ID format.
