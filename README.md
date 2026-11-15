# CompIT 2026 rCTF Platform

Modern, high-performance Jeopardy CTF platform designed for CompIT 2026 (Departemen Teknologi Informasi ITS).

Built with **Bun**, **Hono**, **SvelteKit**, **PostgreSQL**, and **Redis**.

---

## Architecture Overview

```
Contestant Browser
       │ HTTPS (:443)
       ▼
Host Nginx Reverse Proxy (TLS termination, Let's Encrypt)
       │ HTTP (:8080)
       ▼
compit-web (Nginx Container - SvelteKit SPA)
       ├── Static assets (Gzip/Brotli)
       └── Reverse proxy `/api/` ──► compit-api (Bun Hono Service - Port 3000)
                                         ├── Database: PostgreSQL 16 (:5432)
                                         └── Cache: Redis 7 (:6379)
```

---

## Features

- **Blazing Fast Performance:** Native Bun runtime with Hono HTTP framework and lightweight Svelte frontend.
- **Dynamic Scoring:** Real-time decay scoring mechanism with tiebreak support.
- **Automated Challenge Deployment:** Sync challenges directly from a GitHub repository via CLI or CI/CD (`./deploy-challenges.sh`).
- **Automatic Attachment Storage:** Local binaries, PCAPs, and source code are automatically hashed (SHA-256) and hosted on rCTF static storage.
- **Standardized Team Management:** Automated batch team credential generation and CSV export.
- **Production-Hardened:** Multi-stage Docker containers with healthchecks, rate-limiting, and automated backup routines.

---

## Documentation

- **[CHALLENGE-SYNC-GUIDE.md](CHALLENGE-SYNC-GUIDE.md):** Guide for Problem Setters on folder structure, `challenge.yml` specification, and deployment workflow.
- **[VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md):** Complete guide for host server setup, SSL configuration, and maintenance.

---

## Quickstart (Local Development)

### Prerequisites
- [Bun](https://bun.sh) (v1.2+)
- Docker & Docker Compose

### 1. Start Development Database Stack
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Apply Database Migrations
```bash
bun run db:migrate
```

### 3. Run Development Servers
```bash
# Start backend API (Port 3000)
bun run dev:api

# Start frontend Web SPA (Port 5173)
bun run dev:web
```

---

## Production Deployment (VPS)

1. Configure `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with secure production passwords and keys
   ```

2. Build and start containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. Provision admin account:
   ```bash
   bun scripts/create-admin.ts --username admin --password "StrongPasswordHere"
   ```

4. Deploy challenges:
   ```bash
   ./deploy-challenges.sh /path/to/challenges-repo
   ```

---

## Testing

```bash
# Run all unit test suites (1000+ tests)
bun test

# Run monorepo typecheck across all workspaces
bun run typecheck
```

---

## License

This project is licensed under the Apache 2.0 License.
