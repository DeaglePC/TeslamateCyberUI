# ============================================
# TeslamateCyberUI Frontend Dockerfile
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Build the React application
# 如果拉取失败，可以替换为: registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ============================================
# Stage 2: Production image with Nginx
# ============================================
# 如果拉取失败，可以替换为: registry.cn-hangzhou.aliyuncs.com/library/nginx:1.25-alpine
FROM nginx:1.25-alpine

LABEL maintainer="TeslamateCyberUI"
LABEL description="TeslamateCyberUI Frontend - Modern dashboard for TeslaMate"

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script for runtime environment variable injection (e.g. Umami analytics)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Add healthcheck - 使用 GET 请求
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost:80/ > /dev/null || exit 1

# Expose port
EXPOSE 80

# Start Nginx via entrypoint (handles runtime env var injection)
ENTRYPOINT ["/docker-entrypoint.sh"]
