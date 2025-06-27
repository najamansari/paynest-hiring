
# Install global dependencies (only needed for building)
npm install -g pnpm

# Build backend
cd bidder-backend
pnpm install --frozen-lockfile  # Install all dependencies (including dev)
pnpm run build
cp -R dist ../backend

# Build frontend
cd ../bidder-frontend
pnpm install --prod --frozen-lockfile  # Frontend can use --prod
pnpm run build
cp -R dist ../build

# Clean up unnecessary backend files to reduce size
find ../backend -name "*.map" -type f -delete
find ../backend -name "*.d.ts" -type f -delete
rm -rf ../backend/node_modules
