#!/bin/sh
set -e

echo "[entrypoint] Starting TGR server setup..."

# Lấy migrate status (capture cả stdout + stderr, không fail script)
MIGRATE_STATUS=$(npx prisma migrate status 2>&1 || true)
echo "$MIGRATE_STATUS"

# Chỉ resolve khi có P3009
if echo "$MIGRATE_STATUS" | grep -q "P3009"; then
  echo "[entrypoint] P3009 detected. Extracting FAILED migrations only..."

  # Regex bắt dòng: The `20260916010000_xxx` migration started at ... failed
  # Dùng awk để tách chính xác tên migration, không nhầm với "not yet been applied"
  FAILED=$(echo "$MIGRATE_STATUS" \
    | grep "migration started at" \
    | sed -E 's/.*`([0-9]{14}_[a-z_]+)`.*/\1/' \
    | sort -u)

  if [ -z "$FAILED" ]; then
    echo "[entrypoint] No migration names extracted. Manual fix required."
  else
    for MIG in $FAILED; do
      echo "[entrypoint] Resolving FAILED migration: $MIG"
      npx prisma migrate resolve --rolled-back "$MIG" || \
        echo "[entrypoint] resolve failed for $MIG — continuing"
    done
  fi
fi

echo "[entrypoint] Applying migrations..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] WARNING: migrate deploy failed. Starting server anyway."
fi

echo "[entrypoint] Starting server..."
exec node src/index.js