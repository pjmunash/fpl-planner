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

For production you need a CORS-friendly proxy in front of the official FPL API. Options:
- Deploy the included proxy to a host like Render/Railway/Vercel/Heroku/Fly.
- Or use your own Cloudflare Worker / API Gateway that forwards to `https://fantasy.premierleague.com/api` and adds `Access-Control-Allow-Origin: *`.

### Configure the app to use your proxy
Set the build-time env var `VITE_FPL_PROXY_URL` to your proxy base (e.g. `https://your-proxy.example.com/api`). Example on Windows PowerShell:

```powershell
$Env:VITE_FPL_PROXY_URL="https://your-proxy.example.com/api"
npm run build
```

### Defaults
If you do not provide `VITE_FPL_PROXY_URL`, the app will default to `https://cors.isteed.cc/https://fantasy.premierleague.com/api`, plus a few fallback proxies. A dedicated proxy is still recommended for stability.
