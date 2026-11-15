#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CompIT 2026 - Challenge Deployment & Sync Helper
# Usage: ./deploy-challenges.sh [path_to_cloned_challenges_repo]
# ==============================================================================

REPO_DIR="${1:-../challenges}"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "  CompIT 2026 - Challenge Deployment Pipeline"
echo "=================================================="
echo "[*] Target repository: ${REPO_DIR}"

if [ ! -d "${REPO_DIR}" ]; then
  echo "[!] Directory '${REPO_DIR}' not found!"
  echo "[!] Clone the challenge repository first, e.g.:"
  echo "    git clone <CHALLENGES_GITHUB_URL> ${REPO_DIR}"
  exit 1
fi

# 1. Pull latest commits from GitHub if it's a git repo
if [ -d "${REPO_DIR}/.git" ]; then
  echo "[*] Pulling latest updates from GitHub..."
  git -C "${REPO_DIR}" pull || echo "[!] git pull skipped or failed, continuing with local files..."
fi

# 2. Build and run challenge containers
# 2a. Check root docker-compose
ROOT_COMPOSE=""
if [ -f "${REPO_DIR}/docker-compose.yml" ]; then
  ROOT_COMPOSE="${REPO_DIR}/docker-compose.yml"
elif [ -f "${REPO_DIR}/docker-compose.yaml" ]; then
  ROOT_COMPOSE="${REPO_DIR}/docker-compose.yaml"
fi

if [ -n "${ROOT_COMPOSE}" ]; then
  echo "[*] Detected root compose file: ${ROOT_COMPOSE}. Starting containers..."
  docker compose -f "${ROOT_COMPOSE}" up --build -d
fi

# 2b. Auto-discover individual challenge docker-compose files in category subfolders
while IFS= read -r sub_compose; do
  [ -z "${sub_compose}" ] && continue
  if [ -n "${ROOT_COMPOSE}" ] && [ "${sub_compose}" -ef "${ROOT_COMPOSE}" ]; then
    continue
  fi
  echo "[*] Found subfolder challenge compose: ${sub_compose}. Starting container..."
  docker compose -f "${sub_compose}" up --build -d
done < <(find "${REPO_DIR}" -mindepth 2 -type f \( -name "docker-compose.yml" -o -name "docker-compose.yaml" \) 2>/dev/null || true)

# 3. Synchronize challenges metadata & files into rCTF database
echo "[*] Syncing challenges metadata, flags, and attachments into rCTF..."
cd "${BASE_DIR}"
bun scripts/sync-challenges.ts --dir "${REPO_DIR}"

echo ""
echo "[+] Challenge deployment and synchronization complete!"
