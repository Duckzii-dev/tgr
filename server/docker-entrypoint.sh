#!/bin/sh
set -e

echo "[entrypoint] Starting TGR server setup..."

prisma_exec() {
  echo "[entrypoint:exec] $1"
  echo "$1" | npx prisma db execute --stdin 2>&1 || \
    echo "[entrypoint:exec] (skipped)"
}

pre_clean() {
  echo "[entrypoint] Pre-cleaning partial migrations..."

  # Migration 20260916010000_add_finished_at_and_pr_workout
  prisma_exec "DROP INDEX \`Workout_finishedAt_idx\` ON \`Workout\`;"
  prisma_exec "ALTER TABLE \`PersonalRecord\` DROP FOREIGN KEY \`PersonalRecord_workoutId_fkey\`;"
  prisma_exec "DROP INDEX \`PersonalRecord_workoutId_idx\` ON \`PersonalRecord\`;"
  prisma_exec "DROP INDEX \`PersonalRecord_userId_exerciseId_type_key\` ON \`PersonalRecord\`;"
  prisma_exec "DROP INDEX \`PersonalRecord_userId_idx\` ON \`PersonalRecord\`;"
  prisma_exec "DROP INDEX \`PersonalRecord_exerciseId_idx\` ON \`PersonalRecord\`;"
  prisma_exec "DROP INDEX \`PersonalRecord_achievedAt_idx\` ON \`PersonalRecord\`;"
  prisma_exec "ALTER TABLE \`Workout\` DROP COLUMN \`finishedAt\`;"
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`timezone\`;"
  prisma_exec "ALTER TABLE \`PersonalRecord\` DROP COLUMN \`workoutId\`;"

  # Migration 20260916020000_add_admin_role_ipblock_auditlog
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`role\`;"
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`isBanned\`;"
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`bannedAt\`;"
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`bannedReason\`;"
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`lastLoginAt\`;"
  prisma_exec "ALTER TABLE \`User\` DROP COLUMN \`lastLoginIp\`;"
  prisma_exec "DROP INDEX \`User_role_idx\` ON \`User\`;"
  prisma_exec "DROP INDEX \`User_isBanned_idx\` ON \`User\`;"
  prisma_exec "DROP TABLE IF EXISTS \`IpBlock\`;"
  prisma_exec "DROP TABLE IF EXISTS \`AuditLog\`;"

  echo "[entrypoint] Pre-clean done."
}

resolve_failed() {
  FAILED=$(echo "$1" \
    | grep "migration started at" \
    | sed -E 's/.*`([0-9]{14}_[a-z_]+)`.*/\1/' \
    | sort -u)

  for MIG in $FAILED; do
    echo "[entrypoint] Resolving FAILED migration: $MIG"
    npx prisma migrate resolve --rolled-back "$MIG" || true
  done
}

echo "[entrypoint] Applying migrations (attempt 1)..."
DEPLOY_OUT=$(npx prisma migrate deploy 2>&1) && DEPLOY_OK=1 || DEPLOY_OK=0
echo "$DEPLOY_OUT"

if [ "$DEPLOY_OK" = "1" ]; then
  echo "[entrypoint] Migrations applied successfully."
else
  if echo "$DEPLOY_OUT" | grep -qE "P3009|P3018"; then
    pre_clean
    resolve_failed "$DEPLOY_OUT"

    echo "[entrypoint] Applying migrations (attempt 2)..."
    npx prisma migrate deploy 2>&1 && \
      echo "[entrypoint] Migrations applied successfully." || \
      echo "[entrypoint] WARNING: migrate deploy still failing."
  fi
fi
echo "DUYDEPTRAISIEUBAKHI"
echo "[entrypoint] Starting server..."
exec node src/index.js