# Simple E-commerce (Express + Vanilla JS)

## Features
- Product listing + product details pages
- Frontend cart (localStorage)
- Backend order processing + stock validation (in-memory)
- Order confirmation page

## Run
```bash
npm install
npm run dev
```

Then open:
- http://localhost:3000/

## Endpoints (backend)
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`
- `GET /api/orders/:id`

## Notes
- Products + orders are stored in memory (server restart resets everything).
- Cart is stored in the browser (localStorage).

