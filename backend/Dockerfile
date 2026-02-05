# ============================================
# TeslamateCyberUI Backend Dockerfile
# Multi-stage build for optimized production image
# ============================================

# Stage 1: Build the Go application
# 如果拉取失败，可以替换为: registry.cn-hangzhou.aliyuncs.com/library/golang:1.21-alpine
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

# Copy dependency files first for better layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=1 GOOS=linux go build \
    -a -installsuffix cgo \
    -ldflags="-w -s" \
    -o server ./cmd/server

# ============================================
# Stage 2: Production image
# ============================================
# 如果拉取失败，可以替换为: registry.cn-hangzhou.aliyuncs.com/library/alpine:3.19
FROM alpine:3.19

LABEL maintainer="TeslamateCyberUI"
LABEL description="TeslamateCyberUI Backend - API server for TeslaMate data"

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata wget

# Copy the built executable from builder stage
COPY --from=builder /app/server .

# Create non-root user for security
RUN addgroup -g 1000 cyberui && \
    adduser -D -u 1000 -G cyberui cyberui && \
    chown -R cyberui:cyberui /app

# Switch to non-root user
USER cyberui

# Expose port
EXPOSE 8080

# Healthcheck - 使用 GET 请求而非 HEAD (--spider)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost:8080/health || exit 1

# Start server
CMD ["./server"]
