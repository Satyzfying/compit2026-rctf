# CompIT 2026 - Production Deployment & Operations

This document covers production deployment, reverse proxy setup, authentication management, and database maintenance for the CompIT 2026 CTF platform on a Linux VPS.

---

## 1. Production Architecture

```
Contestant Browser
       │ HTTPS (:443)
       ▼
Host Nginx Reverse Proxy (TLS termination, Let's Encrypt)
       │ HTTP (:8080)
       ▼
compit-web (Nginx Container - Port 80 internal)
       ├── Static assets (SvelteKit SPA, pre-compressed brotli/gzip)
       └── Reverse proxy `/api/` ──► compit-api (Bun Hono Service - Port 3000)
                                         ├── Database: compit-postgres (:5432)
                                         └── Cache & Worker: compit-redis (:6379)
```

---

## 2. Server Setup & Dependencies

Target OS: Ubuntu 22.04 LTS or 24.04 LTS.

### 2.1 Install System Packages
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
newgrp docker
```

### 2.2 Project Setup
Copy or clone the `compit-rctf` directory to the server (recommended path: `/opt/compit-rctf`).

```bash
sudo mkdir -p /opt/compit-rctf
sudo chown -R $USER:$USER /opt/compit-rctf
cp -r compit-rctf/* /opt/compit-rctf/
cd /opt/compit-rctf
```

### 2.3 Environment Configuration
Create a `.env` file in `/opt/compit-rctf`:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')
POSTGRES_DB=rctf
RCTF_REDIS_PASSWORD=$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')
RCTF_ORIGIN=https://ctf.compit.its.ac.id
RCTF_TOKEN_KEY=$(openssl rand -base64 32)
```

Ensure file permissions are restricted and uploads directory exists:
```bash
chmod 600 .env
mkdir -p uploads backups
```

---

## 3. Starting the Platform

### 3.1 Build and Launch Containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3.2 Verify Status
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Inspect backend API logs
docker compose -f docker-compose.prod.yml logs -f api
```

---

## 4. Host Nginx & TLS Termination

### 4.1 Install Site Configuration
```bash
sudo cp nginx-host-vps.conf /etc/nginx/sites-available/compit.conf
sudo ln -sf /etc/nginx/sites-available/compit.conf /etc/nginx/sites-enabled/
```

Verify that the `server_name` in `/etc/nginx/sites-available/compit.conf` matches your domain (e.g. `ctf.compit.its.ac.id`).

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2 Provision SSL with Certbot
```bash
sudo certbot --nginx -d ctf.compit.its.ac.id
```

---

## 5. User & Credential Management

Public registration is disabled by default (`registrationsEnabled: false` in `rctf.d/00-base.yaml`). Accounts must be provisioned using the provided CLI scripts.

### 5.1 Create Administrator Account
```bash
bun scripts/create-admin.ts \
  --username admin \
  --password "GenerateStrongPasswordHere" \
  --email admin@compit.its.ac.id
```

### 5.2 Batch Generate Team Credentials
To generate standard numbered teams (e.g. `compit-tim-01` through `compit-tim-30`):
```bash
bun scripts/generate-teams.ts --count 30 --prefix compit-tim-
```

Generated credentials are saved to `scripts/teams-credentials.csv` for distribution to teams.

### 5.3 Import Registered Teams from CSV
If the committee provides a registration export CSV from Google Forms:
```bash
bun scripts/generate-teams.ts --file /path/to/registrants.csv
```

---

## 6. Challenge Deployment

When problem setters push new challenges or updates to the challenge repository:

```bash
# Clone the challenge repository (first time only)
git clone <CHALLENGES_GITHUB_URL> /opt/challenges

# Deploy containers and synchronize challenges into rCTF
cd /opt/compit-rctf
./deploy-challenges.sh /opt/challenges
```

This single command:
1. Pulls the latest commits (`git pull`).
2. Builds and starts any interactive challenge containers (`docker compose up --build -d`).
3. Syncs challenge metadata, points, flags, and attachments directly into the rCTF database.

---

## 7. Maintenance & Backups

### 7.1 Database & Attachments Backups
A backup script is provided:
```bash
./backup-compit.sh
```

This dumps the PostgreSQL database into `backups/compit_backup_YYYYMMDD_HHMMSS.sql.gz` and compresses all challenge attachments from `./uploads` into `backups/compit_uploads_YYYYMMDD_HHMMSS.tar.gz`.

To set up an automated hourly cron job during the competition:
```bash
(crontab -l 2>/dev/null; echo "0 * * * * cd /opt/compit-rctf && ./backup-compit.sh >/dev/null 2>&1") | crontab -
```

### 7.2 Disaster Recovery & Restoration
In case of emergency rollback or recovery:
```bash
# 1. Restore Database
gunzip < backups/compit_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i compit-postgres psql -U postgres -d rctf

# 2. Restore Challenge Attachments
tar -xzf backups/compit_uploads_YYYYMMDD_HHMMSS.tar.gz -C .
```

### 6.3 Real-time Monitoring
```bash
# Monitor container resource utilization (CPU, Memory, Network I/O)
docker stats
```
