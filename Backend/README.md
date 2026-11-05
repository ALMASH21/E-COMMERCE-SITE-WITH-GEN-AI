# FasGifts

FasGifts is an e-commerce application with a customer storefront and an owner workspace.

## Run locally

1. Start MongoDB locally, or set `MONGODB_URI` to your MongoDB connection string.
2. Copy `.env.example` to `.env` and set a private, random `JWT_SECRET`.
3. From `Backend`, run `npm install`, `npm run seed` (once), and `npm start`.
4. From `Frontend`, run `npm install` and `npm run dev`. Vite serves the UI at `http://localhost:5173` and proxies `/users`, `/owners`, `/products`, and `/orders` to the backend on port `3000`.
5. Open `/owner` and create the first admin for local development. The bootstrap endpoint is disabled when `NODE_ENV=production`.

The seed command inserts the sample catalog only when a product with the same name does not already exist. It does not overwrite existing catalog edits.

## API overview

Request validation failures return `400` with an `errors` array. Customer registration/login use `POST /users/register` and `POST /users/login`. Owner login uses `POST /owners/login`; the first local admin is created with `POST /owners/create`. Login issues an HTTP-only cookie, `POST /users/logout` clears it, and `GET`/`PATCH /users/profile` reads and updates customer details, preferences, and addresses.

- `GET /products` and `GET /products/:productId` return active catalog products.
- `PUT`/`DELETE /users/wishlist/:productId` persist a customer's wishlist.
- `POST /orders` validates current prices and stock, reserves inventory, and records a customer order. `GET /orders` lists that customer's orders. This demo does not collect or process payment information.
- Owner endpoints under `/owners` include `GET /dashboard`, catalog CRUD, `GET /orders`, `PATCH /orders/:orderId/status`, and `GET /customers`.
- `PATCH /products/:productId/stock` changes stock for authenticated staff.

Cookie authentication is used by the browser; API clients may instead send a bearer token in the `Authorization` header.
