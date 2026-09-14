# Pulse: AI-Powered Customer Intelligence Platform
**Project Summary & Technical Context for Resume Generation**

*Instructions for Claude/ChatGPT: Use the following deeply technical context to generate senior-level resume bullet points, interview talking points, or project summaries for a Full-Stack / Software Engineer role.*

---

## 1. High-Level Overview
Pulse is a full-stack, distributed microservice application designed to ingest, analyze, and visualize customer feedback at scale. It acts as an intelligence dashboard for product managers to see exactly what customers are saying, instantly categorized by Sentiment (Positive, Negative, Neutral) and Topic/Aspect (Product Quality, Customer Service, Delivery, etc.). 

## 2. Core Tech Stack
* **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Axios, React Router. (Deployed on Vercel)
* **Backend API (Traffic Controller):** Node.js, Express.js. (Deployed on Render)
* **Machine Learning API:** Python 3.11, FastAPI, Scikit-Learn, Pandas, Joblib. (Deployed on Render)
* **Database:** Managed MySQL 8.0 (Aiven Cloud).
* **3rd Party Integrations:** Resend HTTP API (for transactional emails).

---

## 3. Key Engineering Accomplishments & Architecture (The "Brag Sheet")

### A. Machine Learning Pipeline & NLP
Instead of relying on slow, expensive, and heavy LLMs (like OpenAI GPT), the project utilizes a lightweight, blazing-fast local NLP pipeline capable of running on a severely memory-constrained cloud environment (Render's 512MB RAM Free Tier).
* **The Models:** Uses `TfidfVectorizer` (with 1-to-3-gram context windows to capture complex negations like "not very good") paired with heavily regularized `LogisticRegression` models for multi-class classification.
* **The Dataset:** The models are trained on a custom-generated synthetic dataset of over **6,300 rows** (`generate_dataset.py`) engineered to include highly complex English vocabulary (e.g., "abysmal", "immaculate", "deplorable").
* **Confidence Scoring:** Instead of just returning a strict label, the Python API mathematically calculates a "Confidence Score" by extracting the maximum probability from the Logistic Regression's probability distribution (`predict_proba`).
* **Performance:** Achieves a validated **100% accuracy** on the synthetic test split, returning predictions in single-digit milliseconds.

### B. Stateless Multi-Tenancy (Data Isolation)
To allow multiple recruiters to test the live portfolio demo concurrently without destroying each other's data, the application implements a clever stateless multi-tenant architecture.
* **Frontend:** Silently generates a unique UUID upon first visit and stores it in `localStorage`. An Axios interceptor automatically attaches this as an `X-Tenant-ID` header to all API requests.
* **Backend:** A custom Express middleware (`tenant.js`) intercepts the header and injects `req.tenantId` into every controller. Every single MySQL query (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) is hard-scoped to `WHERE tenant_id = ?`, providing complete data isolation without the heavy overhead of a traditional User Authentication (JWT/OAuth) system.

### C. Asynchronous Event-Driven Alerting (Bypassing SMTP Blocks)
The system is configured to instantly alert product managers if a highly severe negative review is detected.
* **Fire-and-Forget:** When the Node.js API receives a negative inference from the ML service, it calculates a Severity threshold. If breached, it fires an async background process to send an email, immediately returning a `200 OK` to the frontend so the user's browser isn't blocked waiting for the email to send.
* **Resend HTTP API:** Originally designed with Nodemailer, cloud providers like Render block outbound SMTP ports (25, 465, 587) to prevent spam. The architecture was successfully pivoted to use the **Resend HTTP REST API** via Axios to bypass the firewall completely. Emails are sent using a beautifully crafted HTML/CSS template rather than plain text.

### D. Concurrency & Idempotency
The application allows users to bulk-upload `.csv` files containing thousands of reviews.
* To prevent race conditions (e.g., multiple concurrent requests trying to create the same "Daily Batch"), the application pushes the concurrency logic down to the database engine. It utilizes MySQL `UNIQUE (label, tenant_id)` constraints combined with `INSERT IGNORE` conflict resolution, completely avoiding Time-Of-Check to Time-Of-Use (TOCTOU) application-layer bugs.

### E. DevOps & Cloud Infrastructure Hacks
* **Automated CI/CD:** Both Render microservices (Node and Python) automatically rebuild and deploy on pushes to the GitHub `main` branch via a `render.yaml` Infrastructure-as-Code file. The Python build step automatically trains and serializes the `.pkl` models via `joblib` before starting the server.
* **Zero-Latency Keep-Alive:** Render's free tier spins down servers after 15 minutes of inactivity, causing massive 60-second cold-start delays. To bypass this and ensure recruiters have an instant experience, a custom **GitHub Actions Cron Workflow** was engineered (`.github/workflows/keep-alive.yml`) to ping the `/health` endpoints of the microservices every 10 minutes, forcing the containers to stay awake.

### F. UI / UX Polish
* Completely responsive, modern dashboard built with Tailwind CSS.
* Implemented optimistic UI updates for instant feedback deletion (UI updates immediately, network request syncs in the background).
* Replaced native browser `window.confirm` popups with custom-built animated React modals for a premium SaaS feel.
* Utilizes floating Toast notifications to alert users when a background email alert is successfully dispatched.
