# FPL Planner Proxy Server

A simple Node.js proxy server for handling CORS requests to the Fantasy Premier League API.

## Setup

The proxy is included and can be run alongside the dev server:

```bash
npm run dev:with-proxy
```

Or run the proxy separately:

```bash
npm run proxy
```

The proxy will start on port 8080 and forward requests from `/api/*` to `https://fantasy.premierleague.com/api/*`.

## Deployment

To deploy the proxy to production, you can use any Node.js hosting service like:
- Heroku
- Railway
- Render
- Vercel
- AWS Lambda

Then update `vite.config.ts` to point to your proxy URL in production.
