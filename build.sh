#!/bin/bash

set -e

echo "Initiating build process..."
ls -alh
# Build backend with serverless config
cd bidder-backend
ls -alh
pnpm install --frozen-lockfile
echo "Running BE serverless build..."
pnpm run build:serverless

# Create backend directory structure
mkdir -p ../backend
cp -R dist ../backend/dist
cp package.json ../backend/

# Install production dependencies
cd ../backend
echo "Installing BE prod deps..."
pnpm install --prod --frozen-lockfile
ls -alh ../backend
# Build frontend
cd ../bidder-frontend
ls -alh
echo "Installing FE deps..."
pnpm install --frozen-lockfile
echo "Running FE build..."
pnpm run build
cp -R dist ../build
ls -alh ../build
# Cleanup
rm -rf backend/package.json
echo "Build completed successfully!"
