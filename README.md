# Pulse - AI-Powered Customer Feedback Intelligence Platform

**Pulse** is a robust, production-grade Customer Feedback Intelligence Platform designed to automatically analyze, categorize, and prioritize customer reviews using Machine Learning and Generative AI.

Instead of a basic CRUD app, Pulse simulates a real-world SaaS architecture where raw feedback streams in, gets processed by an ML microservice (Sentiment & Topic Detection), summarized by an LLM (Executive Insights), and is securely stored and presented in a React-based analytics dashboard.

---

## 🚀 Architecture & Tech Stack

### High-Level Flow
```
User / API (Feedback Submission) 
  → Node.js / Express (Vercel Serverless API) 
      → Fallback Heuristic ML Engine (Graceful Degradation)
      → Python / FastAPI (Render ML Microservice) 
          → Scikit-learn (TF-IDF + Logistic Regression)
      → Groq API (Llama 3 Generative AI Summaries)
  → MySQL (Aiven Cloud Storage & Indexing)
  → Vercel Cron Jobs (Smart Alerts for critical feedback)
  → React / Tailwind CSS (Frontend Dashboard on Vercel)
```

### Technology Decisions & "Why?"

| Component | Technology | Why it was chosen over alternatives? |
| :--- | :--- | :--- |
| **Frontend** | **React + Vite + Tailwind CSS** | Provides a fast, modern component-based UI. Hosted on Vercel for instant global edge delivery. |
| **Backend API** | **Node.js (Vercel Serverless)** | Migrated from traditional stateful hosting to Serverless to bypass cloud limits, drastically reduce costs, and scale infinitely. Built-in Graceful Fault Tolerance ensures 100% uptime even if microservices timeout. |
| **Generative AI** | **Groq API (Llama 3 / Qwen)** | Replaced Google Gemini for Executive Summaries. Groq's specialized LPUs offer < 300ms inference times, preventing Serverless HTTP timeouts and feeling magical to the user. |
| **Database** | **MySQL (Aiven)** | Cloud-hosted MySQL provides true concurrency, robust ACID transactions, and connection pooling needed for Serverless. Used `INSERT IGNORE` with unique constraints to mathematically eliminate a previous Time-Of-Check-Time-Of-Use (TOCTOU) race condition. |
| **ML/NLP Service** | **FastAPI (Python)** | Isolated ML processing into a separate microservice. Deployed independently, allowing the fast Node.js API to remain non-blocking. |
| **ML Approach** | **Scikit-learn (TF-IDF)** | A custom TF-IDF pipeline outputs real statistical probabilities (confidence scores) and feature importances. It is highly explainable, lightweight, and extremely robust. |

---

## ✨ Features
1. **Intelligent Sentiment Analysis**: Predicts Positive, Neutral, or Negative sentiment with exact confidence probabilities.
2. **Generative Executive Summaries**: Leverages Groq's API to instantly read batches of recent feedback and summarize core themes dynamically.
3. **Graceful Fault Tolerance**: The Node API automatically intercepts microservice timeouts and switches to a local Heuristic AI fallback, guaranteeing 100% API availability.
4. **Smart Alerts**: Calculates a Priority/Severity score. If highly negative feedback passes a specific threshold, it triggers an email alert.
5. **Race-Condition-Free Batching**: Groups bulk CSV uploads securely using SQL unique constraints.
6. **Advanced Dashboard**: Features server-side pagination, multi-column filtering, analytical data visualization, and real-time workflow statuses.

---

## 🗄️ Database Schema (MySQL)

- **`batches`**: Groups feedback together (e.g., a specific CSV upload). Uses a `UNIQUE` constraint on `label` to prevent race conditions during concurrent creations.
- **`reviews`**: The core table. Stores `review_text`, `sentiment`, `confidence`, `severity`, `aspect`, `status`, and `timestamp`. Linked to `batches` via a Foreign Key.
- **`settings`**: A Key-Value table for dynamic application settings (like `alert_threshold`).

---

## 💻 Installation & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MySQL Server running locally
- Groq API Key

### 1. Database Setup
Ensure MySQL is running. The Node application will automatically initialize the database on first run:
```bash
cd backend-node
node src/db/init.js
```

### 2. ML Service (FastAPI)
```bash
cd backend-python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install fastapi uvicorn scikit-learn joblib pandas pydantic
python train_models.py
uvicorn app:app --host 0.0.0.0 --port 5001 --reload
```

### 3. Backend API (Node.js)
```bash
cd backend-node
npm install
# Create a .env file (see Environment Variables below)
npm run dev
```

### 4. Frontend Dashboard (React)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

**`backend-node/.env`**
```env
PORT=5000
PYTHON_SERVICE_URL=http://localhost:5001/predict
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=pulse_db
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CORS_ORIGIN=*
GROQ_API_KEY=gsk_your_groq_api_key
```

**`frontend/.env`**
```env
VITE_API_BASE=http://localhost:5000/api
```

---

## 🚀 Deployment Strategy
Pulse is designed with a modern Serverless microservice deployment topology:
- **Frontend**: **Vercel**
- **Node.js Backend API**: **Vercel Serverless Functions** (Migrated from Render for superior speed and scale).
- **Python ML Service**: **Render** (Web Service).
- **Database**: **Aiven Cloud MySQL**.
