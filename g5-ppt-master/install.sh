#!/usr/bin/env bash
# G5 × ppt-master 安裝腳本（冪等，可重複執行）
#
# 做三件事：
#   1. 把 hugohe3/ppt-master 的 skill 安裝到 Claude Code 的技能目錄（固定在已驗證的版本）
#   2. 安裝 Python 依賴
#   3. 把 G5 品牌（g5-edusoc）與風格（g5-warm-rhythm）工作區複製進去並註冊索引
#
# 用法：
#   bash install.sh                      # 安裝到 ~/.claude/skills/ppt-master
#   bash install.sh --target <目錄>      # 安裝到指定目錄
#   PPT_MASTER_REF=main bash install.sh  # 改用上游最新版（未經 G5 驗證）
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${HOME}/.claude/skills/ppt-master"
REF="${PPT_MASTER_REF:-5e8856be0da8e6bc85c4aa28acc614478f7b7137}"   # 二〇二六年十月三十日，v6.8.0，已驗證
REPO_URL="https://github.com/hugohe3/ppt-master.git"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    *) echo "未知參數：$1" >&2; exit 2 ;;
  esac
done

PY="$(command -v python3 || command -v python)"
[[ -n "${PY}" ]] || { echo "找不到 python3，請先安裝 Python 3.10 以上版本" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf -- "${WORK}"' EXIT

echo "▶ 下載 ppt-master（${REF}）"
git clone --quiet --filter=blob:none --no-checkout "${REPO_URL}" "${WORK}/ppt-master"
git -C "${WORK}/ppt-master" checkout --quiet "${REF}"

echo "▶ 安裝 skill 到 ${TARGET}"
mkdir -p "$(dirname "${TARGET}")"
if [[ -d "${TARGET}" ]]; then
  BACKUP="${TARGET}.bak.$(date +%Y%m%d%H%M%S)"
  mv -- "${TARGET}" "${BACKUP}"
  echo "  既有目錄已備份為 ${BACKUP}"
fi
cp -R "${WORK}/ppt-master/skills/ppt-master" "${TARGET}"

echo "▶ 安裝 Python 依賴"
if ! "${PY}" -m pip install -q -r "${TARGET}/requirements.txt"; then
  # Debian/Ubuntu 系統套件（例如 blinker）無法被 pip 移除時的退路
  "${PY}" -m pip install -q --ignore-installed blinker
  "${PY}" -m pip install -q -r "${TARGET}/requirements.txt"
fi

echo "▶ 完整性檢查"
"${PY}" "${TARGET}/scripts/attribution_guard.py"

echo "▶ 安裝 G5 工作區"
cp -R "${KIT_DIR}/workspaces/brands/g5-edusoc"      "${TARGET}/templates/brands/"
cp -R "${KIT_DIR}/workspaces/styles/g5-warm-rhythm" "${TARGET}/templates/styles/"

for spec in brands/g5-edusoc styles/g5-warm-rhythm; do
  "${PY}" "${TARGET}/scripts/svg_quality_checker.py" "${TARGET}/templates/${spec}/templates" \
    --template-mode --canonical-authoring >/dev/null
done
"${PY}" "${TARGET}/scripts/register_template.py" g5-edusoc --kind brand >/dev/null
"${PY}" "${TARGET}/scripts/register_template.py" g5-warm-rhythm --kind style >/dev/null

echo "✔ 完成"
echo "  品牌工作區：${TARGET}/templates/brands/g5-edusoc"
echo "  風格工作區：${TARGET}/templates/styles/g5-warm-rhythm"
echo "  請重新啟動 Claude Code，讓它載入 ppt-master 技能。"
