#!/bin/bash

set -e

echo "Initiating build process..."

# Build backend with serverless config
cd bidder-backend

pnpm install --frozen-lockfile
echo "Running BE serverless build..."
pnpm run build:serverless

# Create backend directory structure
mkdir -p ../backend
cp -R dist ../backend/dist
cp package.json pnpm-lock.yaml ../backend/

# Install production dependencies
cd ../backend
echo "Installing BE prod deps..."
pnpm install --prod --frozen-lockfile

# Build frontend
cd ../bidder-frontend

echo "Installing FE deps..."
pnpm install --frozen-lockfile
echo "Running FE build..."
pnpm run build
cp -R dist ../build

# Cleanup
rm -rf backend/package.json
echo "Build completed successfully!"

cd ../
find . -name serverless*
