#!/bin/bash

npm run download:allowlist
npm run download:blocklist
npm run cloudflare-delete
npm run cloudflare-create
