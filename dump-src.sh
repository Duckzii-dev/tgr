#!/usr/bin/env bash
# =============================================================================
# dump-src.sh — Gộp toàn bộ source code vào 1 file all.txt
# Usage:  chmod +x dump-src.sh && ./dump-src.sh
# =============================================================================
set -euo pipefail

ROOT="$(pwd)"
OUT="$ROOT/all.txt"

# ---------- Cấu hình exclude ----------
EXCLUDE_DIRS=(
  "node_modules"
  ".git"
  "dist"
  "build"
  ".next"
  ".vite"
  "coverage"
  ".cache"
  ".turbo"
  ".idea"
  ".vscode"
)

EXCLUDE_FILES=(
  "all.txt"
  "package-lock.json"
  "yarn.lock"
  "pnpm-lock.yaml"
  ".DS_Store"
)

# ---------- Hàm kiểm tra exclude ----------
is_excluded_dir() {
  local name="$1"
  for d in "${EXCLUDE_DIRS[@]}"; do
    [[ "$name" == "$d" ]] && return 0
  done
  return 1
}

is_excluded_file() {
  local name="$1"
  for f in "${EXCLUDE_FILES[@]}"; do
    [[ "$name" == "$f" ]] && return 0
  done
  # Bỏ qua file quá lớn (> 500KB) để tránh all.txt phình to
  if [[ -f "$name" ]]; then
    local size
    size=$(wc -c < "$name" 2>/dev/null || echo 0)
    [[ "$size" -gt 512000 ]] && return 0
  fi
  return 1
}

# ---------- Ghi header ----------
{
  echo "================================================================"
  echo "# SOURCE DUMP"
  echo "# Root    : $ROOT"
  echo "# Created : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "# Host    : $(uname -a)"
  echo "================================================================"
  echo ""
} > "$OUT"

# ---------- Hàm đệ quy ----------
dump_dir() {
  local dir="$1"
  local rel="${dir#$ROOT/}"
  [[ "$rel" == "$dir" ]] && rel="."

  # Sắp xếp file/folder để output ổn định
  while IFS= read -r -d '' entry; do
    local name
    name="$(basename "$entry")"

    if [[ -d "$entry" ]]; then
      is_excluded_dir "$name" && continue
      dump_dir "$entry"
    elif [[ -f "$entry" ]]; then
      is_excluded_file "$name" && continue
      # Bỏ qua binary (mp4, jpg, png, ...) — chỉ dump text
      if file --mime "$entry" | grep -q "charset=binary"; then
        continue
      fi
      local relpath="${entry#$ROOT/}"
      {
        echo ""
        echo "//=============================================================="
        echo "//FILE: $relpath"
        echo "//=============================================================="
        cat "$entry"
        echo ""
        echo "//END-FILE: $relpath"
        echo ""
      } >> "$OUT"
    fi
  done < <(find "$dir" -mindepth 1 -maxdepth 1 -print0 | sort -z)
}

# ---------- Chạy ----------
echo "🔍 Scanning $ROOT ..."
dump_dir "$ROOT"

# ---------- Thống kê ----------
LINES=$(wc -l < "$OUT")
SIZE=$(du -h "$OUT" | cut -f1)
FILES=$(grep -c "^//FILE:" "$OUT" || true)

echo ""
echo "✅ Done"
echo "   Output : $OUT"
echo "   Files  : $FILES"
echo "   Lines  : $LINES"
echo "   Size   : $SIZE"
echo ""
echo "Gửi file all.txt cho tôi để phân tích source."