# ---- Stage 1: Build the React Frontend ----
# We use a specific version of Node for consistency. 'alpine' images are smaller.
FROM node:20-alpine AS frontend-builder

# Set the working directory for the frontend
WORKDIR /app/frontend

# Copy package.json and pnpm-lock.yaml first to leverage Docker layer caching
COPY bidder-frontend/package.json bidder-frontend/pnpm-lock.yaml ./

# Install frontend dependencies using pnpm
RUN npm i -g pnpm && pnpm install --frozen-lockfile

# Copy the rest of the frontend source code
COPY bidder-frontend/ ./

# Generate the production build of the React app using pnpm
RUN pnpm run build

# ---- Stage 2: Build and Run the Node.js Backend ----
# Use the same Node.js base image for the final container
FROM node:20-alpine AS backend-builder

# Set the working directory for the backend
WORKDIR /app/backend

# Copy package.json and pnpm-lock.yaml for the backend
COPY bidder-backend/package*.json bidder-backend/pnpm-lock.yaml ./

# Install pnpm globally using npm
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy the backend source code
COPY bidder-backend/ ./

# Build application
RUN pnpm build

# --- Combine Frontend and Backend ---
# Copy the built static files from the 'frontend-builder' stage
# This command copies the contents of /app/frontend/dist into /app/build

# Production stage
FROM node:20-alpine as production

WORKDIR /usr/src/app

# Install production dependencies
COPY bidder-backend/package*.json bidder-backend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./dist/build

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/main.js"]
