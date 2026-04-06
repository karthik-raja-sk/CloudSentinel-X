
🛡️ CloudSentinel X
Enterprise-Grade AI-Driven Cloud Security & Threat Hunting Platform

📖 Overview
CloudSentinel X is an advanced cloud security posture management (CSPM) and threat detection platform inspired by enterprise ecosystems like AWS Security Hub. Built to protect critical cloud workloads, it autonomously scans for infrastructure misconfigurations, storage malware, and sensitive data exposures (PII/Secrets). At its core, an intelligent Risk Correlation Engine fuses disparate alerts into actionable incident reports and clear visual attack paths.

🚀 Live Demo
Frontend Application: https://cloudsentinel-x-1.onrender.com
Backend API & Swagger Docs: https://cloudsentinel-x.onrender.com/docs
✨ Core Features
🔍 Cloud Configuration Analysis: Identifies leaky storage buckets, exposed IAM privileges, and non-compliant policies.
🦠 Serverless Malware Detection: Hunts for malicious signatures and suspicious extensions using active signature simulation and file hashing.
🕵️ Sensitive Data Leak Detection: Discovers unsecured PII (Emails, Phones, Aadhaar IDs, API Keys) natively in cloud storage.
🛡️ Automated Data Redaction: Secures exposed secrets through zero-leak persistence, guaranteeing sensitive values are irreversibly masked before database commitment.
🧠 Risk Correlation Engine: Contextualizes independent vulnerabilities, mapping multi-stage Attack Paths and escalating multi-vector threats into critical Intelligence Incidents.
📊 Real-Time Security Dashboard: Summarizes the threat landscape with interactive telemetry, severity charting, and mitigation tracking.
🛠️ Tech Stack
Frontend: React 18 (TypeScript), Vite, Tailwind CSS, Recharts, Lucide React
Backend: Python 3.10+, FastAPI, SQLAlchemy, Pydantic
Database: SQLite (Highly portable, Edge-ready architecture)
Deployment: Render (Frontend Static Site + Python Web Service)
🏗️ Architecture Flow
text
┌─────────────────┐       ┌────────────────────┐       ┌──────────────────┐
│   React / Vite  │       │  FastAPI Backend   │       │ Threat Scanners  │
│  (Cloud Admin)  │ ────► │ (REST API / Core)  │ ────► │  - File / Virus  │
└─────────────────┘       └─────────┬──────────┘       │  - Data Leaks    │
                                    │                  │  - IAM / Config  │
                                    ▼                  └──────────────────┘
                          ┌────────────────────┐
                          │ Risk Correlation & │
                          │ Attack Path Engine │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  SQLite Database   │
                          │(Incidents / Alerts)│
                          └────────────────────┘
📁 Project Structure
text
CloudSentinel X/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Backend REST Endpoints (Findings, Scans, Incidents)
│   │   ├── models/         # SQLAlchemy ORM Models
│   │   ├── schemas/        # Pydantic Typing definitions
│   │   └── services/       # Scanners, Parsers & Correlation Engines
│   ├── datasets/           # System Mock/Sample Files (Malware, DBs, CSVs)
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/
    │   ├── api/            # API Client + Interceptors
    │   ├── components/     # UI, Error Boundaries, Routing
    │   ├── pages/          # Dashboard, Malware, Data Leaks, Incidents
    │   └── context/        # React Context (State Management)
    ├── .env.production     # Production routing
    └── package.json        # Node dependencies & scripts
⚡ Local Setup Instructions
1. Backend Setup
bash
# Navigate to backend
cd backend
# Create Virtual Environment
python -m venv venv
venv\Scripts\activate  # On MacOS/Linux: source venv/bin/activate
# Install Dependencies
pip install -r requirements.txt
# Run the Server (Localhost:8000)
uvicorn app.main:app --reload
2. Frontend Setup
bash
# Navigate to frontend in a new terminal
cd frontend
# Install Dependencies
npm install
# Run Vite Dev Server (Localhost:5173)
npm run dev
🔐 Environment Variables
Backend (backend/.env - Optional)

env
USE_LOCAL_FALLBACK=True # Bypasses complex message queues for SQLite/FastAPI dev
Frontend (frontend/.env.local)

env
VITE_API_URL=http://localhost:8000/api/v1
Frontend (frontend/.env.production)

env
VITE_API_URL=https://cloudsentinel-x.onrender.com/api/v1
📂 Sample Dataset
The platform ships with a mock datasets/s3_bucket/ directory to simulate real-world storage threat-hunting:

malicious.bat: A simulated executable designed to trigger the High-Severity Malware engine.
customers.csv: A raw plaintext file containing PII (Phone Numbers, Emails) to trigger the Data Leak Detector and dynamic redaction pipeline.
💡 Challenges Solved
React Rendering Crashes: Hardened global Hook rendering structures and implemented top-level Error Boundaries to gracefully catch conditional execution failures.
Infinite Data Duplication: Developed a tail-target Scan-ID filtering algorithm to ensure analytical queries pull only the accurate, latest active project state instead of infinitely hallucinating historical logs.
Data Localization Contexts: Engineered dynamic os.path directory fallbacks so internal micro-scanners resolve correctly whether the application is running via local terminal, Docker, or Cloud VPS scopes.
Vite SPA Routing Deficits: Designed the Render configuration using standard Rewrite Rules (/* -> /index.html) to support seamless direct-linking to client-side pages without 404 Not Found server errors.
🎯 Future Enhancements
Docker Orchestration: Containerizing both layers via docker-compose to provide instant localized reproduction.
Celery & Redis: Extending the background worker queues to process asynchronous multi-gigabyte S3 scans concurrently.
Presidio NLP Integration: Utilizing Microsoft's Presidio data-loss-prevention packages to catch context-aware PII leaks instead of purely Regex pattern-matching.
👔 Resume Highlights
Software Engineering: Single-handedly scaled a multi-tier architectural monolith via React and Python/FastAPI using robust REST paradigms.
Cloud Security Principles: Implemented real-world CSPM threat heuristics encompassing sensitive-data redaction, malware isolation, and IAM risk analysis.
DevOps Problem-Solving: Diagnosed and remedied complex production deployment issues related to API port configurations, database schema duplication, and React lifecycle crashes.
👨‍💻 Author
Designed, developed, and secured by [Your Name Here]
Cloud Security Architect & Full-Stack Engineer

