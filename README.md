# Thai Statement

Public web app to convert digital PDF bank statements from **SCB**, **KBank**, and **KTB** into **CSV** or **Excel**.

- No login required for conversion
- Optional Google sign-in to save conversion history (30 days, transactions only — PDFs are never stored)
- Digital/text PDFs only (no OCR)

## Getting started

```bash
npm install
cp .env.example .env.local
# Set AUTH_SECRET (required for auth routes)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes (if using auth) | Random secret for NextAuth |
| `GOOGLE_CLIENT_ID` | For sign-in | Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | For sign-in | Google OAuth secret |
| `DATABASE_URL` | For history | PostgreSQL connection string |
| `ALLOWED_EMAIL_DOMAIN` | No | Restrict Google sign-in to one email domain |
| `TRUST_PROXY_HEADERS` | No | Set to `1` when behind a reverse proxy that sets `X-Forwarded-For` |

## Database migrations

With `DATABASE_URL` set:

```bash
npm run db:push
# or apply drizzle/0000_init.sql manually
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest unit tests |
| `npm run db:push` | Push Drizzle schema to database |

## Supported banks

- SCB (Siam Commercial Bank)
- KBank (Kasikorn)
- KTB (Krungthai)

Auto-detection runs on PDF text; use the bank dropdown if detection fails.

## Limits

- Max file size: 10 MB (validated by magic bytes after upload)
- Max pages: 20
- Max transactions per conversion: 10,000
- Rate limit: 20 requests per minute per client (Vercel `x-real-ip`, or set `TRUST_PROXY_HEADERS=1` behind your own proxy)

## Improving parsers

Place sanitized sample PDFs in `tests/fixtures/` and add golden `rows.json` expectations. Parsers live in `src/lib/parse/banks/`.

## Deploy

Deploy to Vercel with Node.js runtime for `/api/convert`. Set environment variables in the project dashboard.
