# CompIT 2026 - Challenge Authoring & Deployment Guide

This document describes how problem setters organize challenges and how the infrastructure team deploys them onto the CompIT 2026 platform.

---

## 1. Overview & Workflow

The deployment workflow is designed to minimize setter friction:

1. **Problem Setters:** Push challenges to a shared GitHub repository. Each challenge has its own folder containing `challenge.yml`, any source/attachment files, and a `Dockerfile` (if the challenge requires an interactive service).
2. **Infrastructure Team:** Clones the repository on the VPS. Running a single command (`./deploy-challenges.sh`) pulls updates, starts service containers, and syncs all challenge descriptions, flags, dynamic scoring, and download attachments into the rCTF platform.

```
[Problem Setters]
       │
       │  (git push)
       ▼
[GitHub Challenge Repo]
       │
       │  (git clone / git pull on VPS)
       ▼
[Host VPS: ./deploy-challenges.sh]
       ├── Docker Compose: builds and runs web/pwn service containers
       └── rCTF Sync Script: parses challenge.yml, uploads files, updates database
```

---

## 2. Challenge Folder Structure

Organize challenges by category in the repository:

```text
challenges/
├── web/
│   └── agentic/
│       ├── challenge.yml       # Metadata, description, flags, points
│       ├── Dockerfile          # Container definition for web service
│       └── src/                # Web application source files
├── pwn/
│   └── baby-bof/
│       ├── challenge.yml
│       ├── Dockerfile          # xinetd / socat container for binary service
│       ├── bof.c               # Source code
│       └── dist/
│           └── bof.zip         # Attachment for participants
├── crypto/
│   └── rsa-starter/
│       ├── challenge.yml
│       ├── encrypt.py
│       └── output.txt          # Challenge attachment
└── rev/
    └── crackme/
        ├── challenge.yml
        └── crackme.elf         # Binary attachment
```

---

## 3. Challenge Specification (`challenge.yml`)

The parser supports both CTFd/`ctfcli` format and native rCTF format.

### Format A: CTFd / ctfcli compatible
```yaml
name: "agentic"
author: "lylera_"
category: "Web Exploitation"
description: |
  Find the hidden configuration endpoint not meant to be indexed by search bots.

  Target: `http://ctf.compit.its.ac.id:1110`
value: 500
type: dynamic
extra:
  initial: 500
  minimum: 100
  decay: 30
flags:
  - compit{r0b0ts_txt_1s_n0t_s3cur1ty_9182}
files:
  - dist/source.zip
```

### Format B: Minimal rCTF format
```yaml
name: "My first ATP"
author: "lylera_"
category: "Binary Exploitation"
description: |
  Classic 32-bit stack buffer overflow. Hijack execution flow to spawn a shell.

  Connection: `nc ctf.compit.its.ac.id 1001`
points:
  min: 100
  max: 500
flag: compit{buffer_overflow_baby_first_step}
files:
  - dist/bof.zip
```

### Key Field Reference

| Field | Description |
| :--- | :--- |
| `name` | Challenge title displayed on the dashboard. |
| `author` | Setter handle / author name. |
| `category` | Valid categories: `Web Exploitation`, `Binary Exploitation`, `Cryptography`, `Digital Forensic`, `Reverse Engineering`, `Miscellaneous`. |
| `description` | Markdown body. Code blocks, links, and formatting are fully supported. |
| `points` | Scoring range (min `100`, max `500`). Dynamic decay is applied automatically. |
| `flag` / `flags` | Correct flag. Must follow the competition format: `compit{...}`. |
| `files` | List of attachments. Local file paths (e.g. `dist/bof.zip`) are automatically uploaded to rCTF static storage. External links (e.g. Google Drive) are also supported. |

---

## 4. Port Allocations for Interactive Services

Based on the competition coordinator schedule, interactive challenge containers bind to the following ports:
- **Web Exploitation:** Ports `1110` to `1112`.
- **Binary Exploitation (Pwn):** Ports `1001` to `1002`.
- **Misc:** Port `3647`.

Include the target host and port in the challenge description so contestants know how to connect (e.g. `nc ctf.compit.its.ac.id 1001` or `http://ctf.compit.its.ac.id:1110`).

---

## 5. Infrastructure Deployment on VPS

To deploy or update all challenges from the repository on the VPS:

```bash
# 1. Clone the challenge repository (first time only)
git clone <CHALLENGES_REPO_URL> /opt/challenges

# 2. Run the deployment and sync script
cd /opt/compit-rctf
./deploy-challenges.sh /opt/challenges
```

The script will automatically:
1. Pull the latest commits from GitHub (`git pull`).
2. Build and launch any interactive containers (`docker compose up --build -d`).
3. Parse all `challenge.yml` files, upload attachments, and update the rCTF database.
