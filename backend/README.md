# Backend data providers

The Express backend owns data access. Services depend on the stable repository modules in
`src/repositories`; those modules resolve the configured provider and expose the same repository
contract regardless of the database implementation.

## Selecting a provider

Set `DB_PROVIDER=sqlserver` or `DB_PROVIDER=mongodb` in the backend environment. SQL Server remains
the default and uses `DATABASE_URL`; MongoDB uses `MONGODB_URI` and the optional `MONGODB_DATABASE`.
Existing aliases `prisma` and `mongo` continue to resolve to `sqlserver` and `mongodb`.

The Next.js app should use external backend mode for either provider. Set
`NEXT_PUBLIC_BACKEND_MODE=external`, `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`, and
`BACKEND_API_URL=http://localhost:5000/api/v1` in its environment. This keeps database credentials
server-side in the Express backend.

## MongoDB setup

MongoDB transactions are used to keep book-copy reservations and borrowing requests consistent.
Use MongoDB Atlas or run local MongoDB as a replica set (for example start `mongod` with
`--replSet rs0`, then run `rs.initiate()` once). Compass is a database client, not the database
server. Add `replicaSet=rs0` to a local URI, such as
`mongodb://127.0.0.1:27017/?replicaSet=rs0`.

The adapter creates its indexes when the API starts and stores numeric IDs and API record shapes
compatible with the SQL Server provider. To create the first administrator, set
`INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` in `backend/.env`, then run
`npm run db:seed:admin` from this directory. The MongoDB driver works with the same repository
interfaces as the SQL Server provider; services and API routes do not need database-specific code.

## Testing MongoDB locally

1. Install backend dependencies with `npm install`, then start the MongoDB replica set.
2. Set `DB_PROVIDER=mongodb`, `MONGODB_URI`, `JWT_SECRET`, `INITIAL_ADMIN_EMAIL`, and
   `INITIAL_ADMIN_PASSWORD` in `backend/.env`. Use a unique admin email.
3. Run `npm run db:seed:admin`, then start the API with `npm run dev`.
4. Open `http://localhost:5000/api/health`; a connected database returns
   `{"status":"ok","database":"up"}`. Then open `http://localhost:5000/api/v1/books`; an empty
   database returns an empty catalog.
5. In Postman, sign in with `POST http://localhost:5000/api/v1/auth/login` and JSON
   `{"email":"your-admin@example.com","password":"your-admin-password"}`. Copy the returned
   token and set `Authorization: Bearer <token>` on admin requests.
6. With that token, send `POST http://localhost:5000/api/v1/books` with JSON such as:

   ```json
   {
     "title": "MongoDB Test Book",
     "author": "Test Author",
     "isbn": "",
     "category": "Testing",
     "year": 2024,
     "publisher": "Local Test",
     "pages": 100,
     "description": "A temporary book for checking the MongoDB provider.",
     "totalCopies": 2
   }
   ```

   A successful response contains the book ID. Confirm it appears in the books endpoint and in
   Compass under the configured database's `books` collection. You can also check
   `/api/v1/reports/summary` and `/api/v1/reports/categories`. Use only test data when exercising
   create/update/delete operations.
