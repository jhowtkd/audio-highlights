# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Create tmp directories with correct ownership
RUN mkdir -p /tmp/uploads && \
    chown -R nodejs:nodejs /tmp/uploads && \
    chmod 755 /tmp/uploads

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Set ownership of app files
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
