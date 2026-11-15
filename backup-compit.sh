#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Automatically load environment variables from .env (for cron jobs)
if [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="${BACKUP_DIR}/compit_backup_${TIMESTAMP}.sql.gz"
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/compit_uploads_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"

echo "[*] Dumping PostgreSQL database..."
docker exec compit-postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-rctf}" | gzip > "${DB_BACKUP_FILE}"
echo "[+] Database backup successfully created: ${DB_BACKUP_FILE} ($(du -h "${DB_BACKUP_FILE}" | cut -f1))"

if [ -d "./uploads" ] && [ "$(ls -A ./uploads 2>/dev/null)" ]; then
  echo "[*] Archiving uploads attachments directory..."
  tar -czf "${UPLOADS_BACKUP_FILE}" uploads
  echo "[+] Uploads backup successfully created: ${UPLOADS_BACKUP_FILE} ($(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1))"
else
  echo "[*] Directory ./uploads is empty or does not exist yet. Skipping file archive."
fi

# Retain backups from the last 7 days
find "${BACKUP_DIR}" -type f \( -name "compit_backup_*.sql.gz" -o -name "compit_uploads_*.tar.gz" \) -mtime +7 -delete 2>/dev/null || true
echo "[+] All backup operations completed successfully."
