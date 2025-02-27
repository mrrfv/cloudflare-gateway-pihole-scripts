#!/bin/sh
cd /app
npm run download:allowlist
npm run download:blocklist
npm run cloudflare-delete
npm run cloudflare-create
