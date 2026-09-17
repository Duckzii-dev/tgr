#!/bin/sh
set -e

echo "[entrypoint] Starting TGR server setup..."

# ------------------------------------------------------------
# 1. Kiểm tra trạng thái migration
# ------------------------------------------------------------
echo "[entrypoint] Checking migration status..."
MIGRATE_STATUS=$(npx prisma migrate status 2>&1 || true)
echo "$MIGRATE_STATUS"

# ------------------------------------------------------------
# 2. Nếu có migration fail, resolve --rolled-back từng cái
# ------------------------------------------------------------
FAILED_MIGRATIONS=$(echo "$MIGRATE_STATUS" | grep -oE '[0-9]{14}_[a-z_]+' | sort -u || true)

if [ -n "$FAILED_MIGRATIONS" ]; then
  echo "[entrypoint] Detected failed migrations:"
  echo "$FAILED_MIGRATIONS"
  for MIG in $FAILED_MIGRATIONS; do
    echo "[entrypoint] Resolving $MIG as rolled-back..."
    npx prisma migrate resolve --rolled-back "$MIG" || true
  done
fi

# ------------------------------------------------------------
# 3. Apply migrations
# ------------------------------------------------------------
echo "[entrypoint] Applying migrations..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] WARNING: migrate deploy failed. Server will start anyway."
  echo "[entrypoint] Fix migration manually via Railway Run Command:"
  echo "[entrypoint]   npx prisma migrate resolve --rolled-back <migration_name>"
  echo "[entrypoint]   npx prisma migrate deploy"
fi

# ------------------------------------------------------------
# 4. Start server
# ------------------------------------------------------------
echo "[entrypoint] Starting server..."
exec node src/index.js