# 🛡️ CloudSentinel X

### Enterprise-Grade AI-Driven Cloud Security & Threat Hunting Platform

---

## 📖 Overview

CloudSentinel X is an advanced **Cloud Security Posture Management (CSPM)** and threat detection platform inspired by enterprise tools like AWS Security Hub.

It autonomously scans cloud environments to detect:

* 🔓 Infrastructure misconfigurations
* 🦠 Storage-based malware
* 🕵️ Sensitive data leaks (PII & secrets)

At its core, a powerful **Risk Correlation Engine** transforms raw findings into:

* 🚨 Actionable incidents
* 🧭 Attack paths
* 💡 Remediation insights

---

## 🌐 Live Demo

* 🔗 **Frontend:** https://cloudsentinel-x-1.onrender.com
* 🔗 **Backend API Docs:** https://cloudsentinel-x.onrender.com/docs

---

## ✨ Core Features

### 🔍 Cloud Configuration Analysis

* Detects public storage buckets
* Identifies exposed IAM permissions
* Flags non-compliant policies

---

### 🦠 Malware Detection

* Signature-based scanning
* Suspicious file extension detection
* Hash-based threat identification

---

### 🕵️ Data Leak Detection

* Emails
* Phone numbers
* Aadhaar-like IDs
* API keys & credentials

---

### 🔐 Automated Data Redaction

* Masks sensitive data before storage
* Ensures **zero raw PII exposure**

---

### 🧠 Risk Correlation Engine

* Links vulnerabilities across layers
* Generates:

  * 🚨 Critical incidents
  * 🧭 Attack paths
  * 📌 Root cause analysis

---

### 📊 Security Dashboard

* Real-time analytics
* Severity visualization
* Project-based monitoring

---

## 🏗️ Architecture

```text
Frontend (React + Vite)
        ↓
API Layer (Axios)
        ↓
Backend (FastAPI)
        ↓
Security Engines
 ├── Malware Scanner
 ├── Data Leak Detector
 ├── IAM Analyzer
        ↓
Risk Correlation Engine
        ↓
SQLite Database
```

---

## 🛠️ Tech Stack

### Frontend

* React (TypeScript)
* Vite
* Tailwind CSS
* Axios

### Backend

* Python 3.10+
* FastAPI
* SQLAlchemy
* Pydantic

### Deployment

* Render (Frontend + Backend)
* GitHub

---

## 📂 Project Structure

```text
CloudSentinel-X/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── datasets/
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   └── context/
    ├── .env.production
    └── package.json
```

---

## ⚡ Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Production (.env.production)

```env
VITE_API_URL=https://cloudsentinel-x.onrender.com/api/v1
```

---

## 📂 Sample Dataset

Located in:

```
datasets/s3_bucket/
```

Includes:

* `malicious.bat` → Malware detection
* `customers.csv` → Data leak detection
* `safe.txt` → Clean baseline

---

## 💡 Challenges Solved

* Fixed React crashes using Error Boundaries
* Implemented global API error handling
* Prevented PII exposure with masking pipeline
* Built correlation engine for multi-risk analysis
* Solved deployment issues (CORS, routing, env config)

---

## 🎯 Future Enhancements

* 🤖 AI-based anomaly detection
* ☁️ AWS/GCP real integration
* 🔐 Role-based access control
* ⚡ Real-time streaming logs
* 📊 Advanced analytics

---

## 💼 Resume Highlights

* Built full-stack cloud security platform using React & FastAPI
* Implemented malware detection, PII redaction, and correlation engine
* Designed attack-path-based incident analysis system
* Deployed production-ready SaaS on Render

---

## 👨‍💻 Author

**Karthik Raja S**
Cloud Security Engineer | Full-Stack Developer

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
