#!/usr/bin/env bash
# ================================================================
# FEATURE 64: e1RM VỚI RIR ADJUSTMENT
# Chạy từ ~/Code/tgr: bash feature64.sh
# ================================================================
set -euo pipefail

TGR_DIR="$HOME/Code/tgr"
cd "$TGR_DIR"

cat > server/src/utils/calc.js <<'EOF'
// ============================================================
// VOLUME
// ============================================================
export function volume(weight, reps) {
  return Number(weight) * Number(reps);
}

// ============================================================
// e1RM với RIR adjustment
//
// Công thức:
//   e1RM = Weight × (1 + (Reps + RIR) / 30)
//
// Trong đó:
//   - Reps = số rep thực hiện
//   - RIR  = Reps In Reserve (số rep còn dự trữ)
//   - Reps + RIR = số rep ước tính nếu set tới failure
//
// Quy tắc:
//   - Nếu có RIR → dùng RIR adjustment.
//   - Nếu không có RIR → Epley chuẩn (RIR = 0, tức coi như sát failure).
//   - Chỉ tính cho reps ≤ 20 (trên ngưỡng này e1RM thiếu chính xác).
//   - RIR hợp lệ: 0-5. Trên 5 → coi là 5 (chặn ảnh hưởng quá lớn).
// ============================================================
export function epley1RM(weight, reps, rir = null) {
  const w = Number(weight);
  const r = Number(reps);

  if (!w || !r || r <= 0) return null;

  // Chỉ tính cho reps ≤ 20
  if (r > 20) return null;

  // Clamp RIR: 0-5, mặc định 0 nếu null/undefined
  let effectiveRir = 0;
  if (rir != null) {
    effectiveRir = Math.max(0, Math.min(5, Number(rir) || 0));
  }

  const totalReps = r + effectiveRir;

  // Nếu total reps > 25 → quá xa failure → không đáng tin
  if (totalReps > 25) return null;

  const e1rm = w * (1 + totalReps / 30);
  return +e1rm.toFixed(2);
}

// ============================================================
// e1RM dùng actual 1RM nếu user thực sự test 1RM
// ============================================================
export function effective1RM(weight, reps, rir = null, actual1RM = null) {
  if (actual1RM != null && Number(actual1RM) > 0) {
    return Number(actual1RM);
  }
  return epley1RM(weight, reps, rir);
}

// ============================================================
// Duration (giữ nguyên)
// ============================================================
export function durationSeconds(start, end) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000));
}

// ============================================================
// ISO week (giữ nguyên)
// ============================================================
export function isoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ============================================================
// Timezone helpers (giữ nguyên)
// ============================================================
export function dateKeyInTz(date, timezone = 'UTC') {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

export function yearMonthInTz(date, timezone = 'UTC') {
  const key = dateKeyInTz(date, timezone);
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

export function isoWeekInTz(date, timezone = 'UTC') {
  const key = dateKeyInTz(date, timezone);
  const [y, m, d] = key.split('-').map(Number);
  const local = new Date(Date.UTC(y, m - 1, d));
  const day = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((local - yearStart) / 86400000 + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
EOF
echo "✅ server/src/utils/calc.js"

# ============================================================
# Cập nhật workout.controller.js — truyền RIR vào epley1RM
# ============================================================
python3 <<'PYEOF'
import re

file = 'server/src/controllers/workout.controller.js'
with open(file) as f:
    content = f.read()

# 1. addSet: epley1RM(weight, reps) → epley1RM(weight, reps, rir)
old_add = "estimated1RM: epley1RM(weight, reps),"
new_add = "estimated1RM: epley1RM(weight, reps, rir),"

if old_add in content:
    content = content.replace(old_add, new_add)
    print("✅ Updated addSet")

# 2. updateSet: epley1RM(w, r) → epley1RM(w, r, rir)
old_update = "estimated1RM: epley1RM(w, r),"
new_update = "estimated1RM: epley1RM(w, r, rir != null ? Number(rir) : ex.rir),"

if old_update in content:
    content = content.replace(old_update, new_update)
    print("✅ Updated updateSet")

with open(file, 'w') as f:
    f.write(content)
PYEOF

# ============================================================
# Cập nhật pr.service.js — truyền RIR
# ============================================================
python3 <<'PYEOF'
file = 'server/src/services/pr.service.js'
with open(file) as f:
    content = f.read()

# evaluatePRs: dùng epley1RM với rir nếu có
old_eval = "  const est = epley1RM(w, r);"
new_eval = "  const est = epley1RM(w, r, rir ?? null);"

# Cần thêm `rir` vào params
content = content.replace(
    "export async function evaluatePRs({\n  userId,\n  exerciseId,\n  weight,\n  reps,\n  achievedAt,\n  excludeWorkoutId,\n}) {",
    "export async function evaluatePRs({\n  userId,\n  exerciseId,\n  weight,\n  reps,\n  rir = null,\n  achievedAt,\n  excludeWorkoutId,\n}) {"
)

if old_eval in content:
    content = content.replace(old_eval, new_eval)
    print("✅ Updated evaluatePRs")

# rebuildAllPRs: prior sets dùng epley1RM cũng nên có rir
old_prior = "    const e = s.estimated1RM ?? epley1RM(s.weight, s.reps);"
new_prior = "    const e = s.estimated1RM ?? epley1RM(s.weight, s.reps, s.rir ?? null);"

if old_prior in content:
    content = content.replace(old_prior, new_prior)
    print("✅ Updated priorBest calc")

with open(file, 'w') as f:
    f.write(content)
PYEOF

# ============================================================
# Cập nhật workout.controller.js finishWorkout — truyền rir
# ============================================================
python3 <<'PYEOF'
file = 'server/src/controllers/workout.controller.js'
with open(file) as f:
    content = f.read()

# finishWorkout: evaluatePRs cần rir
old = """      const candidates = await evaluatePRs({
        userId,
        exerciseId: we.exerciseId,
        weight: s.weight,
        reps: s.reps,
        achievedAt: endTime,
        excludeWorkoutId: id,
      });"""

new = """      const candidates = await evaluatePRs({
        userId,
        exerciseId: we.exerciseId,
        weight: s.weight,
        reps: s.reps,
        rir: s.rir,
        achievedAt: endTime,
        excludeWorkoutId: id,
      });"""

if old in content:
    content = content.replace(old, new)
    print("✅ Updated finishWorkout evaluatePRs")

with open(file, 'w') as f:
    f.write(content)
PYEOF

# ============================================================
# Verify
# ============================================================
echo ""
echo "=== Test e1RM ==="
cd server

node --input-type=module <<'EOF'
import { epley1RM, effective1RM } from './src/utils/calc.js';

console.log('=== Test cases ===');
const tests = [
  { w: 80, r: 6, rir: 2, expected: '101.3' },
  { w: 80, r: 6, rir: 0, expected: '96.0' },     // no RIR → Epley std
  { w: 80, r: 6, rir: null, expected: '96.0' },  // null → std
  { w: 100, r: 5, rir: 1, expected: '120.0' },
  { w: 60, r: 10, rir: 3, expected: '86.0' },
  { w: 100, r: 25, rir: 0, expected: 'null' },   // reps > 20
  { w: 80, r: 20, rir: 6, expected: 'null' },    // total > 25
  { w: 80, r: 5, rir: 10, expected: '?' },        // RIR clamped to 5
];

for (const t of tests) {
  const result = epley1RM(t.w, t.r, t.rir);
  console.log(`${t.w}kg × ${t.r} @ RIR ${t.rir} → ${result} (expected: ${t.expected})`);
}

console.log('');
console.log('=== Actual 1RM override ===');
console.log('effective1RM(80, 6, 2, null) =', effective1RM(80, 6, 2, null));
console.log('effective1RM(80, 6, 2, 110) =', effective1RM(80, 6, 2, 110));  // dùng actual
EOF

cd ..

echo ""
echo "================================================================"
echo "✅ FEATURE 64 hoàn tất"
echo "================================================================"
echo ""
echo "Công thức mới: e1RM = Weight × (1 + (Reps + RIR) / 30)"
echo ""
echo "Quy tắc:"
echo "  - Có RIR → dùng RIR"
echo "  - Không có RIR → Epley chuẩn (RIR = 0)"
echo "  - RIR clamp: 0-5 (trên 5 → 5)"
echo "  - Reps ≤ 20 (trên → null)"
echo "  - Total reps ≤ 25 (trên → null)"
echo ""
echo "Commit + push:"
echo "  git add server/src/utils/calc.js \\"
echo "          server/src/controllers/workout.controller.js \\"
echo "          server/src/services/pr.service.js"
echo "  git commit -m 'Feature 64: e1RM with RIR adjustment'"
echo "  git push"
echo ""