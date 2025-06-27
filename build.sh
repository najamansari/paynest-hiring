#!/bin/bash

# Install backend dependencies
cd bidder-backend
pnpm install --frozen-lockfile

# Copy node_modules to backend directory
mkdir -p ../backend
cp -R node_modules ../backend/node_modules

# Build backend
pnpm run build
cp -R dist ../backend

# Build frontend
cd ../bidder-frontend
pnpm install --prod --frozen-lockfile
pnpm run build
cp -R dist ../build
