#!/bin/bash

# Build backend
cd bidder-backend
pnpm install --prod --frozen-lockfile
pnpm run build:serverless
cp -R dist ../backend

# Build frontend
cd ../bidder-frontend
pnpm install --prod --frozen-lockfile
pnpm run build
cp -R dist ../build
