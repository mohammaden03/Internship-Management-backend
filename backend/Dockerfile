# Multi-stage Dockerfile for NestJS Backend (standardized on port 3010)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build && npm run build:seed

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010

RUN apk add --no-cache curl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Normalize CRLF (Windows checkouts) so the shebang resolves inside the Linux image.
RUN sed -i 's/\r$//' ./docker-entrypoint.sh \
  && chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/uploads/documents \
  && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3010/api/health/ready || exit 1

CMD ["./docker-entrypoint.sh"]
