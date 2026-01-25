# Dockerfile for the backend service
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

# Copy dependency files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the backend application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# Final production image
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies (ca-certificates for HTTPS, tzdata for timezone, wget for healthcheck)
RUN apk add --no-cache ca-certificates tzdata wget

# Copy the built executable from the builder stage
COPY --from=builder /app/server .

# Create a non-root user and group
RUN addgroup -g 1000 cyberui && \
    adduser -D -u 1000 -G cyberui cyberui && \
    chown -R cyberui:cyberui /app

# Switch to the non-root user
USER cyberui

# Expose the port the backend will run on
EXPOSE 8080

# Command to run the backend server
CMD ["./server"]
