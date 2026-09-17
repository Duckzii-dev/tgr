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

pre_clean() {
  echo "[entrypoint] Pre-cleaning partial migrations..."

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
}

resolve_failed() {
  echo "[entrypoint] Resolving FAILED migrations from deploy output..."
  # Bắt tên migration từ dòng: The `20260916010000_xxx` migration started at ... failed
  FAILED=$(echo "$1" \
    | grep "migration started at" \
    | sed -E 's/.*`([0-9]{14}_[a-z_]+)`.*/\1/' \
    | sort -u)

  if [ -z "$FAILED" ]; then
    echo "[entrypoint] No failed migration names extracted."
    return
  fi

  for MIG in $FAILED; do
    echo "[entrypoint] Resolving FAILED migration: $MIG"
    npx prisma migrate resolve --rolled-back "$MIG" || \
      echo "[entrypoint] resolve failed for $MIG — continuing"
  done
}

# ------------------------------------------------------------
# 2. First attempt: migrate deploy
# ------------------------------------------------------------
echo "[entrypoint] Applying migrations (attempt 1)..."
DEPLOY_OUT=$(npx prisma migrate deploy 2>&1) && DEPLOY_OK=1 || DEPLOY_OK=0
echo "$DEPLOY_OUT"

if [ "$DEPLOY_OK" = "1" ]; then
  echo "[entrypoint] Migrations applied successfully (attempt 1)."
else
  # ----------------------------------------------------------
  # 3. Nếu fail vì P3009 hoặc P3018 → pre-clean + resolve + retry
  # ----------------------------------------------------------
  if echo "$DEPLOY_OUT" | grep -q "P3009"; then
    echo "[entrypoint] P3009 detected. Fixing..."
    pre_clean
    resolve_failed "$DEPLOY_OUT"
  elif echo "$DEPLOY_OUT" | grep -q "P3018"; then
    echo "[entrypoint] P3018 detected (partial migration). Fixing..."
    pre_clean
    resolve_failed "$DEPLOY_OUT"
  else
    echo "[entrypoint] migrate deploy failed with unknown error."
  fi

  # ----------------------------------------------------------
  # 4. Second attempt: migrate deploy
  # ----------------------------------------------------------
  echo "[entrypoint] Applying migrations (attempt 2)..."
  DEPLOY_OUT2=$(npx prisma migrate deploy 2>&1) && DEPLOY_OK2=1 || DEPLOY_OK2=0
  echo "$DEPLOY_OUT2"

  if [ "$DEPLOY_OK2" = "1" ]; then
    echo "[entrypoint] Migrations applied successfully (attempt 2)."
  else
    echo "[entrypoint] WARNING: migrate deploy still failing. Starting server anyway."
    echo "[entrypoint] Manual fix required:"
    echo "[entrypoint]   railway ssh --service tgr"
    echo "[entrypoint]   npx prisma migrate resolve --rolled-back <migration_name>"
    echo "[entrypoint]   npx prisma migrate deploy"
  fi
fi

# ------------------------------------------------------------
# 5. Start server
# ------------------------------------------------------------
echo "[entrypoint] Starting server..."
exec node src/index.js