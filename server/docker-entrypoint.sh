#!/bin/sh
set -e

echo "[entrypoint] Starting TGR server setup..."

# ------------------------------------------------------------
# 1. Parse DATABASE_URL
# ------------------------------------------------------------
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
  echo "[entrypoint] DATABASE_URL not set. Starting server anyway."
  exec node src/index.js
fi

DB_USER=$(echo "$DB_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DB_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DB_URL" | sed -E 's|mysql://[^@]+@([^:]+):.*|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|mysql://[^/]+/([^?]*).*|\1|')

echo "[entrypoint] DB: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

mysql_exec() {
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$1" 2>/dev/null || true
}

# ------------------------------------------------------------
# 2. Check migration status
# ------------------------------------------------------------
echo "[entrypoint] Checking migration status..."
MIGRATE_STATUS=$(npx prisma migrate status 2>&1 || true)
echo "$MIGRATE_STATUS"

HAS_P3009="$(echo "$MIGRATE_STATUS" | grep -c 'P3009' || true)"

# ------------------------------------------------------------
# 3. Nếu có P3009 → pre-clean + resolve
# ------------------------------------------------------------
if [ "$HAS_P3009" -gt 0 ]; then
  echo "[entrypoint] P3009 detected. Pre-cleaning partial migrations..."

  # Migration 20260916010000_add_finished_at_and_pr_workout
  mysql_exec "DROP INDEX \`Workout_finishedAt_idx\` ON \`Workout\`;"
  mysql_exec "ALTER TABLE \`PersonalRecord\` DROP FOREIGN KEY \`PersonalRecord_workoutId_fkey\`;"
  mysql_exec "DROP INDEX \`PersonalRecord_workoutId_idx\` ON \`PersonalRecord\`;"
  mysql_exec "DROP INDEX \`PersonalRecord_userId_exerciseId_type_key\` ON \`PersonalRecord\`;"
  mysql_exec "ALTER TABLE \`Workout\` DROP COLUMN \`finishedAt\`;"
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`timezone\`;"
  mysql_exec "ALTER TABLE \`PersonalRecord\` DROP COLUMN \`workoutId\`;"

  # Migration 20260916020000_add_admin_role_ipblock_auditlog
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`role\`;"
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`isBanned\`;"
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`bannedAt\`;"
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`bannedReason\`;"
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`lastLoginAt\`;"
  mysql_exec "ALTER TABLE \`User\` DROP COLUMN \`lastLoginIp\`;"
  mysql_exec "DROP INDEX \`User_role_idx\` ON \`User\`;"
  mysql_exec "DROP INDEX \`User_isBanned_idx\` ON \`User\`;"
  mysql_exec "DROP TABLE IF EXISTS \`IpBlock\`;"
  mysql_exec "DROP TABLE IF EXISTS \`AuditLog\`;"

  echo "[entrypoint] Pre-clean done."

  FAILED=$(echo "$MIGRATE_STATUS" \
    | grep "migration started at" \
    | sed -E 's/.*`([0-9]{14}_[a-z_]+)`.*/\1/' \
    | sort -u)

  if [ -n "$FAILED" ]; then
    for MIG in $FAILED; do
      echo "[entrypoint] Resolving FAILED migration: $MIG"
      npx prisma migrate resolve --rolled-back "$MIG" || \
        echo "[entrypoint] resolve failed for $MIG — continuing"
    done
  fi
else
  echo "[entrypoint] No P3009 detected. Skipping pre-clean."
fi

# ------------------------------------------------------------
# 4. Apply migrations
# ------------------------------------------------------------
echo "[entrypoint] Applying migrations..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] WARNING: migrate deploy failed. Starting server anyway."
fi

# ------------------------------------------------------------
# 5. Start server
# ------------------------------------------------------------
echo "[entrypoint] Starting server..."
exec node src/index.js