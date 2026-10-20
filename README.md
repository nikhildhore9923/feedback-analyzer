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
          → Scikit-learn (TF-IDF + Balanced Logistic Regression)
      → Groq API (Llama 3 Generative AI Summaries)
  → MySQL (Aiven Cloud Storage & Indexing)
  → Vercel Cron Jobs (Smart Alerts for critical feedback)
  → React / Tailwind CSS (Frontend Dashboard on Vercel)
```

### Technology Decisions & "Why?"

| Component | Technology | Why it was chosen over alternatives? |
| :--- | :--- | :--- |
| **Frontend** | **React + Vite + Tailwind CSS** | Fast, responsive component-based UI. Hosted on Vercel for instant global edge delivery. |
| **Backend API** | **Node.js (Vercel Serverless)** | Migrated from stateful hosting to Serverless to bypass cloud limits, drastically reduce costs, and scale infinitely. Built-in Graceful Fault Tolerance ensures 100% uptime even if microservices timeout. |
| **Generative AI** | **Groq API (Llama 3 / Qwen)** | Replaced Google Gemini for Executive Summaries. Groq's specialized LPUs offer < 300ms inference times, preventing Serverless HTTP timeouts. |
| **Database** | **MySQL (Aiven)** | Cloud-hosted MySQL provides true concurrency, robust ACID transactions, and connection pooling needed for Serverless. Used `INSERT IGNORE` with unique constraints to eliminate TOCTOU race conditions. |
| **ML/NLP Service** | **FastAPI (Python)** | Isolated ML processing into a separate microservice. Deployed independently, allowing the fast Node.js API to remain non-blocking. |
| **ML Approach** | **Scikit-learn (TF-IDF + Logistic Regression)** | Highly explainable, lightweight (<15MB RAM, sub-5ms latency), and calibrated with balanced class weights to handle customer review distributions cleanly without heavy GPU requirements. |

---

## 🧠 Machine Learning: Model, Dataset & Benchmarks

### 1. Dataset Provenance & Attribution
* **Dataset Title:** Twitter US Airline Sentiment
* **Original Creator:** **Crowdflower** (later *Figure Eight*, acquired by *Appen*), released February 2015.
* **Canonical License:** **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.
* **Attribution:** *"Twitter US Airline Sentiment dataset, collected and annotated by Crowdflower (Figure Eight / Appen), distributed under CC BY-NC-SA 4.0."*
* **Usage Disclosure:** Permitted for academic research, education, and non-commercial portfolio demonstrations. Commercial production SaaS deployments require proprietary customer data or a commercial open dataset (e.g., CC0/MIT).

### 2. Dataset Reconciliation & Leakage Prevention Audit
* **Raw Records:** 14,640
* **Short/Empty Texts Removed (`<= 10` chars after handle/URL strip):** 265
* **Missing/Unmapped Sentiment Labels:** 0
* **Duplicate Cleaned Texts Removed:** 242
* **Clean Unique Corpus:** **14,133 records**
* **Partitioning:**
  * **Balanced Unseen Test Set (`misc/test_balanced_900.csv`):** 900 records (exactly 300 Positive, 300 Neutral, 300 Negative).
  * **Naturally Distributed Unseen Test Set (`misc/test_natural_stratified.csv`):** 1,500 records (reflecting natural customer feedback proportions: 66% Negative, 20% Neutral, 14% Positive).
  * **Training Pool Candidates:** 11,733 records.
  * **Near-Duplicate Purge:** 60 records matching test samples under case-folding, punctuation-stripping, or high Jaccard similarity (>0.85) were purged from the training set.
  * **Final Clean Training Pool (`misc/train_real_sentiment.csv`):** **11,673 records** with **0 near-duplicate leakage**.

### 3. Empirical Model Performance Comparison

Evaluated on the exact same frozen, unseen test benchmarks:

#### Part A: Balanced Benchmark (900 reviews: 300 per class)
*Tests class discrimination without majority-class bias (random guess = 33.33%).*

| Metric | Baseline Model (Synthetic Data) | Improved Model (Real Feedback) | Improvement |
| :--- | :--- | :--- | :--- |
| **Overall Accuracy** | **43.11%** | **74.22%** | **+31.11%** |
| **Macro F1-Score** | **0.4055** | **0.7407** | **+0.3352 (+82.6%)** |
| **Negative F1** | 0.5146 | **0.7630** | +0.2484 |
| **Neutral F1** | 0.2554 | **0.6905** | +0.4351 |
| **Positive F1** | 0.4464 | **0.7687** | +0.3223 |

#### Part B: Naturally Distributed Benchmark (1,500 reviews)
*Reflects production traffic distribution (991 Negative, 294 Neutral, 215 Positive).*

| Metric | Baseline Model (Synthetic Data) | Improved Model (Real Feedback) | Improvement |
| :--- | :--- | :--- | :--- |
| **Overall Accuracy** | **57.13%** *(negative-bias artifact)* | **79.67%** | **+22.54%** |
| **Macro F1-Score** | **0.4104** | **0.7330** | **+0.3226 (+78.6%)** |
| **Negative F1** | 0.7185 | **0.8740** | +0.1555 |
| **Neutral F1** | 0.1626 | **0.5957** | +0.4331 |
| **Positive F1** | 0.3500 | **0.7293** | +0.3793 |

---

## 💻 How to Run & Reproduce

### Reproduce Benchmark Evaluations
```bash
cd backend-python
python evaluate_benchmark.py
```

### Retrain Models
```bash
cd backend-python
python train_models.py
```

### Run Python ML Unit Tests
```bash
cd backend-python
python -m unittest test_ml_service.py
```

### Run Full System E2E Tests
```bash
node scripts/comprehensive-system-tests.js
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 🔐 Environment Variables

**`backend-node/.env`**
```env
PORT=5000
PYTHON_SERVICE_URL=http://localhost:5001/predict
CORS_ORIGIN=*

# Database (MySQL / Aiven Cloud)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pulse_db

# Security & External Services
JWT_SECRET=your_jwt_secret_min_32_chars
GROQ_API_KEY=gsk_your_groq_api_key
RESEND_API_KEY=re_your_resend_api_key
ALERT_TO=manager@example.com
CRON_SECRET=dev_cron_secret
```

**`frontend/.env`**
```env
VITE_API_BASE=https://feedback-analyzer-api.vercel.app/api
```

---

## 🚀 Live Deployments

* **Frontend Dashboard**: [https://feedback-analyzer-beta.vercel.app](https://feedback-analyzer-beta.vercel.app)
* **Backend API**: [https://feedback-analyzer-api.vercel.app/api](https://feedback-analyzer-api.vercel.app/api)
* **Demo Account**: `admin@pulse.com` / `password123` (Read-only demo mode with sample data protection)
