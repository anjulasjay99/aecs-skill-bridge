# ----------------------------
# Stage 1: Build
# ----------------------------
FROM node:20-alpine AS builder

# Set work directory inside the container
WORKDIR /app

# Copy dependency manifests first (for caching)
COPY package*.json tsconfig.json ./

# Install dependencies (omit dev deps later)
RUN npm ci

# Copy all source files
COPY . .

# Build TypeScript → dist/
RUN npm run build

# ----------------------------
# Stage 2: Runtime
# ----------------------------
FROM node:20-alpine

WORKDIR /app

# Copy only compiled output and minimal runtime deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built JS and any assets
COPY --from=builder /app/dist ./dist

# Environment
ENV NODE_ENV=development
ENV PORT=3003
# MONGODB_URI is injected by Kubernetes Secret at runtime

EXPOSE 3003

CMD ["node", "dist/server.js"]
