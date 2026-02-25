# Multi-stage build for Recipe App with optimized build time
FROM node:18-alpine AS base

# Build the frontend with optimized caching
FROM base AS frontend-builder
WORKDIR /app

# Copy package files first
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend

# Install dependencies with optimized flags
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Build the backend with optimized caching
FROM base AS backend-builder
WORKDIR /app

# Copy package files first
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# Install dependencies with optimized flags
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Copy source files
COPY backend/ ./
RUN echo "Backend files copied"

# Production stage - minimal and optimized
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builders
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/dist ./frontend/dist
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/src ./backend/src
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package*.json ./backend/

# Install only production dependencies
WORKDIR /app/backend
RUN npm install --only=production --legacy-peer-deps --prefer-offline --no-audit && \
    npm cache clean --force

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV FRONTEND_DEV_PORT=5000
ENV SERVER_PORT=3000
ENV NODE_TLS_REJECT_UNAUTHORIZED=0



# Start the application
CMD echo "🚀 Starting Recipe App..." && \
    echo "🌱 Seeding database..." && \
    node src/db/seed.js && \
    echo "✅ Database seeded!" && \
    echo "🚀 Starting server..." && \
    node src/index.js
