# Thai Statement

Public web app to convert digital PDF bank statements from **SCB**, **KBank**, and **KTB** into **CSV** or **Excel**.

- No login or account required
- Digital/text PDFs only (no OCR)
- PDFs are processed in memory and never stored

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

None are required. Optional:

| Variable | Description |
|----------|-------------|
| `TRUST_PROXY_HEADERS` | Set to `1` when behind a reverse proxy that sets `X-Forwarded-For` (not needed on Vercel) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest unit tests |

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

Deploy to Vercel with Node.js 22+ (24.x works). No environment variables are required for PDF conversion.
