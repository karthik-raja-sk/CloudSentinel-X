<div align="center">
  <br />
    <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge" alt="Build" />
    <img src="https://img.shields.io/badge/Security-A%2B-blue?style=for-the-badge" alt="Security" />
  <br />
  
  # CloudSentinel X 🛡️
  
  **AI-Powered Cloud Posture & Threat Detection Platform**

  An advanced, automated cloud security suite designed to parse real-time architectural configurations and logs, actively hunting out misconfigurations, hijacked identities, and layered privilege escalation paths before exploitation occurs.
  
  [Key Features](#key-features) •
  [Architecture](#architecture-overview) •
  [Attack Path Engine](#the-attack-path-engine) •
  [Installation](#setup-instructions) •
  [Screenshots](#screenshots)
</div>

---

## 1. Project Overview
**CloudSentinel X** is a modern Security Posture Management (CSPM) and Cloud Infrastructure Entitlement Management (CIEM) solution. Designed from the ground up to reflect enterprise-grade security engineering, it acts as an intelligent correlator that digests AWS JSON configuration state drops or raw audit logs, pushing them through a segmented **Asynchronous Processing** pipeline.

### Why This Project Matters
**CloudSentinel X** goes beyond traditional security scanners by correlating isolated vulnerabilities into complete attack paths. This enables security teams to prioritize real threats instead of handling disconnected alerts. 

By automatically mapping disjointed vulnerabilities into singular, coherent "Exploitation Chains", CloudSentinel X replicates the exact mindset of an advanced persistent threat (APT)—giving blue teams the visual topology required to patch critical gaps instantly.

---

## 2. Key Differentiator
CloudSentinel X does not just detect vulnerabilities. 

It correlates them into real-world exploit chains, helping identify exactly how attackers can move laterally across cloud systems instead of just throwing isolated noise.

---

## 3. The Problem Statement
In modern **Cloud Security** ecosystems, a single vulnerability is rarely enough to breach an organization. Modern breaches occur through **chained toxic combinations**:

* An S3 bucket is accidentally made public *(Misconfiguration)*.
* The bucket holds an exposed, hardcoded DevOps API key *(Secret Exposure)*.
* The key provides broad `sts:AssumeRole` capabilities *(IAM Risk)*.
* A foreign IP utilizes the key, silently disabling MFA *(Log Threat)*.

Standard security tools flag these as four separate, disconnected low-priority alerts resulting in alert fatigue. CloudSentinel X solves this by linking them contextually through advanced **Risk Correlation**.

---

## 4. Key Features

*   **⚡ Automated Posture Scanning:** Instantaneous parsing of complex Cloud configuration blobs mapping to security baselines.
*   **🔑 CIEM & IAM Privilege Analysis:** Resolves attached vs. inline IAM policies to flag "Shadow Admins", wide `*` wildcards, and inactive MFA states.
*   **🕵️ Secret Exposure Engine:** Heuristic deep-scans discovering embedded RSA keys, AWS access secrets, and database credentials inside unstructured asset payloads.
*   **📜 Real-Time Threat Intel (Audit Logs):** Ingests and correlates CloudTrail-esque logs, mapping suspicious IPs, burst deletion events, and privilege manipulation.
*   **🕸️ Graph-Based Attack Correlation:** Deterministically maps edges between discrete network entities, visualizing lateral movement possibilities without needing heavy GraphDB compute.

---

## 5. Architecture Overview

CloudSentinel X runs on a strictly modular, decoupled, and highly concurrent micro-architecture designed for horizontal scalability:

*   **Frontend:** React/TypeScript SPA Dashboard built cleanly via Tailwind CSS.
*   **API Gateway:** High-throughput Python FastAPI endpoints orchestrating asynchronous database commits.
*   **Broker & Workers:** Extremely heavy scan parsing and graph generation logic are offloaded to background Celery workers utilizing Redis message brokering to free up thread resources.
*   **Database:** PostgreSQL / SQLite Relational schema storage via SQLAlchemy handling complex entity grouping cleanly. 

---

## 6. The Attack Path Engine 🎯
*Highlight of the platform.* 

Rather than merely outputting lists of bad configuration states, the custom **Attack Path Engine** runs continuous cyclic sweeps over all fresh findings upon scan completion. 

It maps nodes (External Actors, Storage Assets, Identities) against weighted exploitation rules representing true **Risk Correlation**. 

**Result:** It generates complex Graph-like topologies directly into a lightweight JSON schema, natively rendering visual, layered attack simulations without visualizing heavy, third-party limitations.

---

## 7. Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, TailwindCSS |
| **Backend API**| Python, FastAPI, Pydantic |
| **Task Queue** | Celery, Redis |
| **Database** | PostgreSQL (Prod), SQLite (Dev), Alembic |
| **Infra** | Docker, Docker Compose |

---

## 8. API Flow

**Upload** → **Background Scan** *(Celery + Redis)* → **Findings Generation** → **Attack Path Correlation** → **Dashboard Visualization**

---

## 9. Setup Instructions

### Option A: Dockerized (Production)
```bash
# 1. Spin up all 4 containers (React, API, Celery, Redis)
docker-compose up --build -d

# 2. Navigate to UI
http://localhost:5173/
```

### Option B: Local Setup (Development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```
*(Ensure local Redis server is executing and run: `celery -A app.worker.tasks worker --loglevel=info`)*

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 10. Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Upload & Scan
![Upload](./screenshots/upload.png)

### Findings Explorer
![Findings](./screenshots/findings.png)

### IAM Entity Risk Mapping
![IAM Entities](./screenshots/iam.png)

### Threat Logs Audit
![Logs](./screenshots/logs.png)

### Correlated Attack Paths
![Attack Paths](./screenshots/attack-paths.png)

### Historic Scan Analytics
![Scans](./screenshots/scans.png)

---

## 11. Demo Flow
To demonstrate to a recruiter or engineering manager:
1. Hit **Upload & Scan** and import a payload.
2. Emphasize the live polling state and how Celery **Asynchronous Processing** prevents API lock-ups.
3. Once completed, navigate to **Dashboard**. Highlight the top-down metrics calculation.
4. Move directly to **Attack Paths**. Show how the **Attack Path Engine** linked an isolated exposed IP with an insecure IAM role to generate a full visual *Exploitation Chain*.
5. Dig into **IAM Entities** and **Logs** to show raw parsed configuration tracking.

---

## 12. Future Improvements
*   **Integrations:** Direct API hooks into live AWS/GCP infrastructure to remove the need for static JSON mapping (Continuous Monitoring).
*   **Remediation:** Implement automated Lambda "Auto-Fix" webhooks directly from the frontend dashboard.
*   **Custom Rulesets:** Allow DevSecOps to define arbitrary YAML graph correlations logic similar to Semgrep rules. 

---

## 13. Resume Bullet Points

Want to add this to your resume? Use these verified points mapping to high-value SWE/Security skills:

*   **Designed and built an end-to-end Cloud Security Posture Management (CSPM) application** using React, TypeScript, and FastAPI yielding a full-stack platform capable of automated complex vulnerability detection.
*   **Engineered an algorithmic Attack Path Engine** utilizing Python heuristics to procedurally generate exploitation graphs natively connecting disparate IAM, Secret, and Asset misconfigurations into contextualized kill chains.
*   **Architected a distributed scanning pipeline** utilizing Celery and Redis to offload heavy security parsing from the main execution thread, resulting in zero-blocking high-throughput file analysis.
*   **Constructed a responsive, decoupled frontend architecture** via Tailwind CSS and React Router parsing layered graph-data formats via Axios, highlighting complex threat intel clearly for rapid incident resolution.
*   **Enforced modern database schema designs** implementing SQLAlchemy and Alembic tracking structured relationships across identities, audit logs, and hardware configurations seamlessly.

---
<div align="center">
<i>Built to protect next-generation cloud perimeters.</i>
</div>
