# Pulse — Factual Technical Report

This report contains a strict, factual analysis of the `feedback-analyzer` codebase as it currently exists. It does not estimate or assume any features that are not explicitly written in the code.

---

## 1. ARCHITECTURE

**High-Level Architecture:**
The application utilizes a decoupled, 3-tier microservice architecture:
1.  **Frontend (Tier 1):** A Single Page Application (SPA) built with React and Tailwind CSS that serves as the analyst dashboard.
2.  **Node.js Backend (Tier 2):** An Express REST API that acts as the primary traffic controller. It handles frontend requests, performs MySQL database CRUD operations, coordinates bulk CSV uploads, and sends email alerts.
3.  **Machine Learning Service (Tier 3):** An isolated Python FastAPI microservice dedicated strictly to NLP (Natural Language Processing).

**Communication:**
The services communicate via REST HTTP over standard ports (80/443 in production). 
- The React frontend sends HTTP requests to the Node.js API.
- The Node.js API sends a synchronous HTTP POST request to the Python ML Service (`/predict`) whenever it needs to analyze text, and waits for a JSON response containing the sentiment and confidence score.

**Folder Structure Overview:**
- `frontend/`: React Vite application.
- `backend-node/`: Express application (MVC structure with `src/controllers`, `src/routes`, `src/services`, `src/db`, `src/utils`).
- `backend-python/`: FastAPI application (`app.py`, `train_models.py`, and serialized models in `models/`).
- `.github/workflows/`: Contains CI/CD automation files.

---

## 2. TECH STACK (EXACT)

**Frontend (from `frontend/package.json`):**
- **Framework:** React (`^18.3.1`), ReactDOM (`^18.3.1`)
- **Build Tool:** Vite (`^5.3.1`)
- **Routing:** react-router-dom (`^6.24.1`)
- **Styling:** Tailwind CSS (`^4.3.3`), Autoprefixer (`^10.6.0`), PostCSS (`^8.5.28`)
- **Icons & Charts:** lucide-react (`^1.45.0`), recharts (`^3.10.1`)
- **HTTP Client:** axios (`^1.7.2`)

**Node.js Backend (from `backend-node/package.json`):**
- **Framework:** Express (`^4.19.2`)
- **Database Driver:** mysql2 (`^3.24.4`)
- **Utilities:** cors (`^2.8.5`), dotenv (`^16.4.5`), axios (`^1.7.2`)
- **File Uploads:** multer (`^1.4.5-lts.1`), csv-parser (`^3.0.0`)
- **Unused Dependencies:** `nodemailer` (`^6.9.14`) is installed but is no longer used in the codebase (the alerting system was migrated to the Resend HTTP API via native `fetch`).

**Python ML Service (from `backend-python/requirements.txt`):**
- **Web Framework:** fastapi (`==0.111.0`), uvicorn (`==0.30.1`), pydantic (`==2.7.4`)
- **Machine Learning:** scikit-learn (`==1.5.0`), pandas (`==2.2.2`), joblib (`==1.4.2`)

---

## 3. DATABASE

**Engine:** MySQL 8.0
**Host:** Aiven Cloud (`pulse-db-pulse-portfolio.j.aivencloud.com`)

**Full Schema (`backend-node/src/db/schema.sql`):**
1.  **`batches` Table:**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `label` VARCHAR(255) NOT NULL UNIQUE
    - `type` VARCHAR(50) NOT NULL
    - `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
2.  **`reviews` Table:**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `review_text` TEXT NOT NULL
    - `sentiment` VARCHAR(50) NOT NULL
    - `confidence` FLOAT
    - `severity` FLOAT DEFAULT 0
    - `aspect` VARCHAR(100)
    - `alert_sent` BOOLEAN DEFAULT FALSE
    - `batch_id` INT (FOREIGN KEY referencing `batches(id)` ON DELETE SET NULL)
    - `status` VARCHAR(50) DEFAULT 'New'
    - `priority_score` FLOAT DEFAULT 0
    - `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP
3.  **`settings` Table:**
    - `setting_key` VARCHAR(100) PRIMARY KEY
    - `setting_value` VARCHAR(255)

**Concurrency / Idempotency:**
Race conditions are legitimately handled at the database level. The `batches` table enforces a `UNIQUE` constraint on the `label` column. When the Node.js API attempts to create a daily batch, it relies on SQL conflict resolution rather than application-level checks, preventing duplicate batch creation during highly concurrent HTTP requests.

---

## 4. API SURFACE

**Node.js Backend (`backend-node/src/routes/index.js`):**
- `GET /health` : Health check endpoint.
- `POST /reviews` : Submits a single review for analysis.
- `GET /reviews` : Fetches reviews (supports pagination and filtering).
- `DELETE /reviews/:id` : Deletes a specific review.
- `POST /reviews/bulk` : Accepts a `.csv` file upload via Multer for batch processing.
- `GET /stats` : Retrieves aggregated data for the React dashboard.
- `GET /batches` : Retrieves a list of upload batches.
- `GET /settings` : Retrieves system configurations (like alert thresholds).
- `POST /settings` : Updates system configurations.

**Python FastAPI (`backend-python/app.py`):**
- `GET /health` & `HEAD /health` : Health check (modified to accept HEAD for UptimeRobot compatibility).
- `POST /predict` : Accepts JSON `{ "text": "..." }` and returns Sentiment, Confidence, Severity, and Aspect.

---

## 5. ML PIPELINE

**Preprocessing & Vectorization:**
- **Technique:** `TfidfVectorizer` (Term Frequency-Inverse Document Frequency).
- **Configuration:** `ngram_range=(1, 2)`. Stop words removal (`stop_words='english'`) was explicitly removed from the code to preserve negation context (like "not good").

**Model Architecture:**
- **Algorithm:** `LogisticRegression`
- **Hyperparameters:** `random_state=42`, `multi_class='multinomial'`, `max_iter=200`.

**Training Process:**
- The model is not trained dynamically. It is trained once during the Render deployment build step via the `python train_models.py` command, and the resulting pipelines are serialized to disk using `joblib` (`sentiment_model.pkl` and `aspect_model.pkl`).
- It parses a generated dataset (`training_data.csv`) consisting of 3,363 unique, varied customer reviews.

**Pipeline Capabilities:**
- The pipeline classifies **BOTH** Sentiment and Topic (Aspect).
- Proof (`train_models.py`): Two completely separate pipelines are trained. `sentiment_pipeline.fit(X_train, y_sent_train)` and `aspect_pipeline.fit(X_train, y_asp_train)`.

**Confidence Score Calculation:**
- The confidence score is extracted directly from the underlying mathematical probability distribution of the Logistic Regression model using `predict_proba`.
- Proof (`app.py`): `confidence = float(np.max(sentiment_model.predict_proba(text)[0]))`.

**Model Evaluation:**
- **IMPLEMENTED.** The script utilizes `train_test_split` (80/20 split) to calculate evaluation metrics.
- Sentiment Model achieves **99.70% Accuracy**.
- Aspect Model achieves **99.70% Accuracy**.

---

## 6. EMAIL ALERTS

**Implementation:**
- The codebase uses the **Resend HTTP API** directly via `axios` inside `backend-node/src/utils/mailer.js`.
- It dynamically pulls the `RESEND_API_KEY` from environment variables to prevent secret leaks on GitHub.

**Trigger Condition:**
- Alerts are triggered based on a configurable threshold stored in the MySQL `settings` table (default `-0.5`). 

**Synchronicity:**
- Alerts are dispatched **asynchronously** (Fire-and-Forget). The Node.js controller does not block the HTTP response waiting for the email API to resolve.

---

## 7. TESTING

- **NOT IMPLEMENTED.** There are no unit tests, integration tests, or test frameworks (like Jest, Mocha, or PyTest) configured or utilized anywhere in the repository.

---

## 8. DEPLOYMENT / CI-CD

**Platforms:**
- **Frontend:** Vercel
- **Node.js API:** Render (`pulse-node-backend`)
- **Python ML API:** Render (`pulse-ml-service`)

**CI/CD Pipeline:**
- **Automated Deployment:** Both Render services are configured via an Infrastructure-as-Code file (`render.yaml`) in the repository root, which automatically rebuilds the services upon pushes to the `main` branch.
- **GitHub Actions:** A custom cron workflow exists in `.github/workflows/keep-alive.yml` that runs every 10 minutes to explicitly ping the Render health endpoints via `curl` to bypass Render's free-tier cold-start latency.

---

## 9. CONCRETE NUMBERS

- **Dataset Size:** **3,363 rows** of generated, highly-varied customer feedback stored in `training_data.csv`.
- **Accuracy:** Validated at **99.70%** for both Sentiment and Aspect models using Scikit-Learn's `classification_report` and `accuracy_score` on a 20% holdout test set.
- **Performance / Latency Benchmarks:** NOT COMPUTED.

---

## 10. INTERVIEW STRATEGY NOTES

**Highly Impressive Aspects (Highlight these):**
1. **GitHub Actions Cron Bypass:** Writing a custom CI/CD pipeline to continuously ping your own microservices to bypass cloud provider sleep mechanisms is a brilliant, scrappy DevOps hack that interviewers love.
2. **Predict Proba Confidence:** Extracting the maximum probability from the Logistic Regression softmax output to mathematically prove "Confidence", rather than just returning a hard class label, demonstrates a deep understanding of ML model mechanics.
3. **Database Concurrency Handling:** Handling race conditions using SQL `UNIQUE` constraints and `INSERT IGNORE` rather than flawed application-level checks shows maturity in backend engineering.
4. **Resend HTTP API Migration:** Navigating Render's SMTP port-blocking firewall by migrating from Nodemailer to a modern HTTP Email API (and utilizing GitHub Secret Scanning / Env Vars) is a fantastic real-world problem-solving story.
5. **Legitimate Evaluation Metrics:** Calculating Accuracy and F1-Scores dynamically using a train/test split on a 3,000+ row dataset elevates the project from a simple "API wrapper" to a legitimate Data Science engineering project.
