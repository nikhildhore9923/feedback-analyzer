# PULSE: FINAL TECHNICAL AUDIT REPORT

This document represents the completely verified, code-based technical audit of the Pulse project. Every claim within this document has been directly corroborated against the existing `c:\feedback-analyzer` source code, database schema, and deployment configuration.

---

## 1. PROJECT OVERVIEW

**What it solves:** Pulse automates the tedious process of reading and classifying customer feedback. It instantly identifies the sentiment and category of feedback, assigns a priority score to highlight urgent issues, and dispatches email alerts for critical problems.
**Target User:** Product Managers, Customer Success teams, and Support Managers.
**Main Workflow:** Users submit feedback manually or via CSV -> Node.js routes text to Python ML service -> ML model classifies sentiment & topic -> Node.js calculates priority and stores in MySQL -> UI Dashboard displays SQL-aggregated analytics -> Resend API dispatches email if feedback is critical.
**Technical Differentiators (vs basic CRUD):**
1. Distributed microservice architecture (React, Node, Python).
2. Integrated Machine Learning inference pipeline.
3. Multi-tenant database isolation.
4. Concurrency-safe database idempotency using `INSERT IGNORE` and composite unique constraints.
5. High-performance SQL-engine aggregations for analytics rather than in-memory processing.

**30-Second Interview Explanation:**
"Pulse is a multi-tenant customer intelligence platform. It uses a React frontend and a Node.js backend to ingest feedback, which is then routed to a Python FastAPI microservice where a custom Scikit-learn model classifies sentiment and topic. The backend computes priority scores, stores data in MySQL, aggregates analytics at the database level, and dispatches asynchronous alerts via the Resend API."

## 2. COMPLETE TECHNOLOGY STACK

*DO NOT claim technologies not listed here.*

**Frontend:**
- React 18.3.1
- Vite
- Tailwind CSS
- Recharts (for analytics visualization)
- Axios (for API communication)
- React Router DOM
- Lucide-React (icons)

**Backend:**
- Node.js
- Express
- MySQL2 (database driver)
- Multer (file uploads)
- CSV-Parser
- Cors & Dotenv

**ML Service:**
- Python 3.11
- FastAPI & Uvicorn
- Scikit-learn 1.5.0
- Pandas & NumPy
- Joblib (model serialization)
- Pydantic (data validation)

**Infrastructure/Deployment:**
- Vercel (Frontend Hosting)
- Render (Node API & Python ML Service Hosting)
- Aiven (MySQL Cloud Database)
- GitHub Actions (Used strictly for a Keep-Alive Cron job)
- Resend API (Email delivery)

## 3. COMPLETE ARCHITECTURE

Pulse utilizes a distributed, service-oriented architecture.

**Primary Flow:**
React Frontend
      | (HTTP REST via Axios)
      v
Node.js + Express Backend
      | (SQL via mysql2/promise)
      v
MySQL Database (Aiven)

**Machine Learning Flow:**
Node.js Backend
      | (HTTP POST /predict)
      v
Python FastAPI ML Service
      | (In-memory execution)
      v
Joblib Scikit-learn Model

**End-to-End Request Flow (Manual Submission):**
1. User enters text in React, triggers POST `/api/reviews`.
2. Express controller passes text to `mlService.js`.
3. `mlService.js` makes HTTP POST to FastAPI `/predict`.
4. FastAPI vectorizes text using TF-IDF, predicts using Logistic Regression, returns `{sentiment, confidence, aspect}`.
5. Express receives ML output, calculates `priority_score` using a deterministic mathematical formula.
6. Express queries MySQL `batches` table using `INSERT IGNORE` to safely get/create a batch ID.
7. Express inserts the review into the MySQL `reviews` table.
8. Express asynchronously evaluates the Resend alert threshold and dispatches an email if Critical, without blocking the HTTP response.
9. Express returns `200 OK` to React.

## 4. 3-TIER / MICROSERVICE ARCHITECTURE

**Is it 3-tier?** YES. Presentation (React) -> Application (Node/Python) -> Data (MySQL).
**Is it a Microservice Architecture?** YES. The application domain is split into two distinct, independently deployable services: a traffic/database API (Node) and a stateless ML inference API (Python).
**Is it distributed?** YES. It runs across Vercel, two Render web services, and an Aiven database.

## 5. FRONTEND ARCHITECTURE

- **Pages:** `Dashboard.jsx`, `Reviews.jsx`, `Settings.jsx`.
- **State Management:** Local `useState` and `useEffect`. (NO Redux/Context).
- **API Layer:** Centralized in `api.js`.
- **Tenant Handling:** `api.js` creates or retrieves a UUID from `localStorage` and uses an Axios Interceptor to inject an `X-Tenant-ID` header into *every* outbound request.
- **Empty/Loading States:** Fully implemented conditionally based on state lengths and boolean flags.

## 6. BACKEND ARCHITECTURE

- **Entry Point:** `server.js`
- **Middleware:** `tenantMiddleware.js` explicitly extracts the `X-Tenant-ID` header and attaches it to `req.tenantId` for isolation.
- **Key Endpoints:**
  - `GET /api/analytics/trends`: Runs `GROUP BY DATE` SQL aggregation for dashboard charts.
  - `GET /api/reviews`: Handles server-side pagination (`LIMIT/OFFSET`) and filtering.
  - `POST /api/reviews/bulk`: Uses `multer` and `csv-parser` to ingest files.
  - `DELETE /api/settings/clear`: Wipes tenant data safely.

## 7. DATABASE

**Schema Verification:**
- `batches`: id, label, type, tenant_id, created_at.
- `reviews`: id, review_text, sentiment, confidence, severity, aspect, alert_sent, batch_id, tenant_id, status, priority_score, timestamp.
- `settings`: setting_key, tenant_id, setting_value.

**Crucial Database Mechanisms:**
- **Foreign Keys:** `batch_id` references `batches(id) ON DELETE SET NULL`.
- **Composite Primary/Unique Keys:** `settings` uses a composite primary key `(setting_key, tenant_id)`. `batches` uses a unique constraint `UNIQUE (label, tenant_id)`.
- **Why?** The composite constraints guarantee that data is structurally isolated per tenant at the database schema level, entirely preventing cross-tenant duplicates and TOCTOU race conditions.

## 8. TENANT ISOLATION

**How it works:**
1. Frontend generates UUID -> saves to `localStorage`.
2. Axios interceptor injects `X-Tenant-ID: <uuid>`.
3. Express `tenantMiddleware` reads header -> sets `req.tenantId`.
4. *Every single SQL query* strictly enforces `WHERE tenant_id = ?` using parameterized queries.

**Security Limitation (Crucial for interviews):**
This is **Tenant Isolation**, not **Authentication**. There is no JWT, OAuth, or password. If someone guesses a UUID, they can see that tenant's data. Be honest about this limitation—it demonstrates maturity.

## 9. MACHINE LEARNING PIPELINE

**Verified Facts:**
- **Dataset Size:** 3,363 rows.
- **Classes:**
  - *Sentiment:* Positive, Negative, Neutral
  - *Aspect:* App/Website, Customer Service, Delivery, General, Pricing, Product Quality
- **Preprocessing:** Scikit-learn `TfidfVectorizer`.
- **N-gram Range:** `(1, 3)` (Unigrams, bigrams, trigrams).
- **Algorithm:** `LogisticRegression(C=10.0, multi_class='multinomial')`.
- **Split:** 80% train / 20% test (`test_size=0.2, random_state=42`).
- **Confidence:** Calculated dynamically using `np.max(sentiment_model.predict_proba())`.
- **Serialization:** `joblib.dump()` creates `.pkl` files loaded into memory by FastAPI at startup.

## 10. MODEL PERFORMANCE

- **Sentiment Accuracy:** 99.70%
- **Aspect/Topic Accuracy:** 99.55%
- **Test Set Size:** 673 rows.
**Interview Strategy:** Do NOT claim your model is a magical AI with 100% accuracy. Explain that the 99% accuracy is an artifact of a *highly constrained, clean dataset*. Real-world messy text would degrade this accuracy. Acknowledging this shows deep ML understanding.

## 11. SENTIMENT & 12. CONFIDENCE SCORE

**Prediction:** Raw text -> Vectorized into TF-IDF numerical array -> Logistic Regression applies learned feature weights -> Outputs probability distribution array -> `argmax()` selects the highest probability class.
**Confidence Score:** The maximum probability value from the `predict_proba()` array.
**Accuracy vs Confidence:** Accuracy is the historical test-set correctness. Confidence is the model's certainty about a *single specific, current prediction*.

## 13. TOPIC / CATEGORY DETECTION

**Implementation:** This is a genuine Machine Learning implementation, not a rule-based system. It uses an identical pipeline architecture to the Sentiment model (TF-IDF + Logistic Regression) trained on a different target variable column.

## 14. PRIORITY / SEVERITY SYSTEM

**Implementation:** A completely deterministic, rule-based mathematical scoring engine. (DO NOT call this part AI).
**Formula:**
- Negative: `Round(50 + (confidence * 50))` -> Range: 55 to 100
- Neutral: `Round(50 - (confidence * 20))` -> Range: 30 to 48
- Positive: `Round(30 - (confidence * 20))` -> Range: 10 to 28
- Critical = 80+, High = 60-79, Medium = 40-59, Low = <40.
**`mockPolarity` Variable:** This is a real production variable. It dynamically maps the new ML confidence metric to the legacy Resend threshold scale (0 to -1) to prevent breaking the user's custom settings.

## 15. SMART ALERTS

**Implementation:** Uses the `axios` library to directly hit the `https://api.resend.com/emails` REST API.
**Triggers:** If a review is inherently Critical (`score >= 80`) OR if its polarity breaches the user's custom `alert_threshold`.
**Asynchronous Nature:** The `sendAlertEmail` function is called *without* an `await` in the main controller. This allows the API to return `200 OK` to the frontend instantly, while the email dispatches in the background.

## 16. CONCURRENCY AND IDEMPOTENCY

**The Problem:** Two requests arriving at the exact same millisecond to submit feedback for "Manual entries - Today".
**The TOCTOU Race Condition:** If we do `SELECT batch` -> `if missing` -> `INSERT batch`, both requests might run the `SELECT` simultaneously, find nothing, and both `INSERT`, causing a duplicate batch.
**The Solution:** The database enforces a `UNIQUE(label, tenant_id)` constraint. We execute `INSERT IGNORE`. The database engine itself handles the race condition natively, ensuring absolute idempotency.

## 17. CSV BULK UPLOAD

**Flow:** React `FormData` -> Express `multer` middleware saves to disk -> `csv-parser` reads rows -> For each row, await FastAPI POST -> Compute Priority -> SQL INSERT -> Delete temp file.
**Limitation:** The processing loop is strictly sequential (`for...of` loop with `await`). A 10,000-row CSV would block the HTTP response for several minutes, likely causing a gateway timeout.

## 18. SENTIMENT TRENDS

**Implementation:** The dashboard does NOT fetch all reviews. It queries `GET /api/analytics/trends`.
**SQL Aggregation:** Uses `GROUP BY DATE(timestamp)`.
**Why?** Fetching 50,000 reviews into Node.js memory just to count them would crash the 512MB RAM Render server. SQL aggregation pushes the computational load to the database engine, which is highly optimized for counting.

## 19-21. UI & CONFIGURATION

- **Dashboard:** KPIs, Sentiment Trends (Recharts Line), Volume (Bar), Priority Breakdown.
- **Feedback List:** Server-side pagination, sorting, status updates, and priority filtering.
- **Settings:** Stores the Resend email recipient and the negative polarity alert threshold. Uses `INSERT IGNORE / ON DUPLICATE KEY UPDATE` concepts in SQL.

## 22. REAL-TIME CLAIMS

**Verdict:** Pulse is **NOT** a real-time WebSocket application. It is a standard HTTP Request-Response SPA. Data updates immediately on the screen because React locally updates state after a successful `200 OK` from the API. Do not claim WebSockets.

## 23 & 24. DEPLOYMENT & CI/CD

- **Frontend:** Vercel (Auto-deploys on push).
- **Backend/ML:** Render (Two separate Web Services).
- **Database:** Aiven MySQL.
- **CI/CD:** There are NO automated tests. GitHub Actions is only used for a `cron` job that runs `curl` against the Render health endpoints every 10 minutes to prevent the free-tier servers from sleeping.

## 25. TESTING

**Verdict:** Entirely manual testing. No unit tests (Jest/PyTest) exist.

## 26. SECURITY AUDIT

- **Strong:** 100% parameterization of SQL queries (`?`) completely prevents SQL Injection.
- **Weak:** Lack of true authentication means tenant IDs can be easily spoofed.

## 27. SCALABILITY LIMITATIONS

- **Weakness:** CSV bulk upload processes sequentially.
- **Weakness:** The `COUNT(*)` query for pagination metadata will eventually slow down at millions of rows because MySQL must scan the index.

---

## PULSE INTERVIEW CHEAT SHEET

1. **Explain your project:** "Pulse is a multi-tenant customer intelligence platform. It uses React, Node, and a Python FastAPI ML microservice to ingest feedback, classify sentiment, calculate priority, aggregate analytics, and send asynchronous alerts."
2. **Why separate ML service?** "Python is the undisputed ecosystem for ML (Scikit-learn, Pandas). Node.js is excellent for asynchronous I/O and web traffic. Separating them allows independent scaling."
3. **Why TF-IDF & Logistic Regression?** "Deep learning (BERT) requires heavy GPU compute. TF-IDF + LogReg is extremely lightweight, requires almost zero memory footprint on Render's free tier, and still achieved excellent accuracy on our specific dataset."
4. **How is confidence calculated?** "It is the maximum probability score returned by Scikit-learn's `predict_proba()` method for the predicted class."
5. **How does tenant isolation work?** "A UUID is passed in an `X-Tenant-ID` header. Express middleware injects it into the request, and every single MySQL query enforces a `WHERE tenant_id = ?` clause."
6. **What race condition did you solve?** "A Time-Of-Check to Time-Of-Use (TOCTOU) condition when creating daily batches. I solved it using a composite UNIQUE constraint and an `INSERT IGNORE` SQL command to guarantee database-level idempotency."
7. **Why aggregate in SQL?** "Pulling thousands of records into Node.js memory just to count them would cause massive memory spikes. `GROUP BY DATE` offloads the work to the MySQL C++ engine, which is highly optimized for it."
8. **Explain priority scoring.** "It's a deterministic mathematical formula that maps ML confidence and sentiment polarity into a strict 0-100 score, which is then bucketed into Critical, High, Medium, and Low."

## INTERVIEWER TRAP QUESTIONS

- **Trap:** "Is your system real-time?" **Answer:** "No, it uses standard HTTP REST request-response. The UI updates optimistically, but there are no WebSockets."
- **Trap:** "How do you secure user data?" **Answer:** "Currently, it uses strict database-level tenant isolation via UUID headers, but it lacks a cryptographic authentication layer like JWT. That would be the next step for production."
- **Trap:** "Your accuracy is 99.7%. Isn't that overfitting?" **Answer:** "Yes, it is extremely high because the training dataset is relatively clean and constrained. In a real-world messy environment, I would expect that accuracy to drop."

## NUMBERS TO MEMORIZE

- **Dataset Size:** 3,363 rows
- **Test Set Size:** 673 rows
- **Classes:** 3 Sentiment, 6 Aspect
- **ML Accuracies:** 99.70% Sentiment, 99.55% Aspect
- **TF-IDF N-grams:** (1, 3)

## FINAL VERDICT

**What is strong:** The microservice separation, the SQL-level data aggregation, the handling of DB race conditions, and the deterministic priority math.
**What I can safely say:** You built a distributed, multi-tenant, machine-learning-powered analytics dashboard.
**What I should NOT say:** Do not claim WebSockets, Automated Testing, JWT Auth, or Deep Learning.
**Bugs/Risks found:** The CSV upload loop is synchronous over an async `await` API call; a very large CSV will cause an HTTP timeout.

*(Audit completed successfully based exclusively on current source code.)*
