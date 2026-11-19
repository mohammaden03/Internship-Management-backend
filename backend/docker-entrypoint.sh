#!/bin/sh
set -e

echo "Applying Prisma schema / migrations..."
if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  ./node_modules/.bin/prisma migrate deploy
else
  ./node_modules/.bin/prisma db push --skip-generate
fi

if [ "${AUTO_SEED:-false}" = "true" ] && [ -f "./dist-seed/seed.js" ]; then
  echo "Checking initial seed data (SEED_IF_EMPTY=true)..."
  SEED_IF_EMPTY=true node ./dist-seed/seed.js
fi

echo "Starting NestJS API server on port ${PORT:-3010}..."
exec node dist/main.js
