# AnyBook — storefront + store admin

Next.js 15 (App Router) + TypeScript + **PostgreSQL via Prisma**. A full online bookstore with a customer storefront, cart and checkout, plus an admin dashboard for books, orders, promo codes and analytics.

## Run it locally

```bash
npm install                # also generates the Prisma client
cp .env.example .env       # then set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:start           # starts Homebrew Postgres 15 (if it isn't already running)
npm run db:migrate         # creates the tables
npm run db:seed            # sample catalogue + 60 days of sample orders (WIPES the database)
npm run dev                # http://localhost:3000
```

Sign in at `/account` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, then open `/admin`.

| Script | What it does |
| --- | --- |
| `npm run db:start` | Starts the local Postgres server (it doesn't auto-start at login) |
| `npm run db:migrate` | Applies schema changes in development (`prisma migrate dev`) |
| `npm run db:deploy` | Applies migrations in production (`prisma migrate deploy`) |
| `npm run db:seed` | Resets the database to the sample data |
| `npm run db:studio` | Browse and edit the data in Prisma Studio |

## How it works

- **Database:** [`prisma/schema.prisma`](prisma/schema.prisma) defines books, collections, users and sessions, orders with order lines, promo codes, reviews, settings, newsletter subscribers and uploaded covers.
- **Reads:** server components call [`src/lib/queries.ts`](src/lib/queries.ts). The shop layout loads the published catalogue, settings and the signed-in user into a context. Book pages are server-rendered with per-book titles and descriptions for SEO.
- **Writes:** server actions in [`src/app/actions/shop.ts`](src/app/actions/shop.ts) and [`src/app/actions/admin.ts`](src/app/actions/admin.ts). Every admin action re-checks the signed-in user's role on the server.
- **Accounts:** passwords are hashed with scrypt. Sessions are random tokens, stored hashed, in an httpOnly cookie that lasts 30 days. Blocked users are signed out at once. Guests who register later get their earlier orders linked to the new account.
- **Roles:** Customer, Staff (can use the admin) and Admin (can also change roles).
- **Checkout:** prices, discounts and delivery are recalculated on the server from the database. Stock is reserved with guarded updates in a serializable transaction, so the last copy can't be sold twice. Cancelling an order returns its copies to stock.
- **Basket and favourites** stay in the browser (`localStorage`), as on most shops, and are validated at checkout.
- **Cover uploads** are stored in Postgres and served from `/api/uploads/:id` with long-term caching.
- **Dashboard** figures (sales, orders, average order value, returning customers, top sellers, and the comparison with the previous period) are computed from real orders.

## Deploying

Any Node host works, e.g. Vercel, Railway or Render, with a managed Postgres such as Neon or Supabase. Set `DATABASE_URL`, run `npm run db:deploy` once, then create the owner account with `npm run db:seed`, or register normally and promote yourself with `npm run db:studio`.

## Not done yet (before taking real orders)

- **Online card payments:** "Credit / debit card" currently means a card machine on delivery. Connecting a gateway such as Paymob or Stripe is the next step.
- **Emails:** order confirmations, shipping updates and password reset (the "Forgot password?" link is a placeholder).
- **Rate limiting** on sign-in and checkout, and an audit log of admin actions.
- **Image storage:** covers live in the database, which is fine for a small catalogue. Move them to S3 or R2 as it grows.
