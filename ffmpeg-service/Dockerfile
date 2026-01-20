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

WORKDIR /app

# Create tmp directories for uploads
RUN mkdir -p /tmp/uploads

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
