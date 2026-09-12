# Pulse — Customer Feedback Intelligence Platform

**Pulse** is a robust, production-grade Customer Feedback Intelligence Platform designed to automatically analyze, categorize, and prioritize customer reviews using Machine Learning.

Instead of a basic CRUD app, Pulse simulates a real-world SaaS architecture where raw feedback streams in, gets processed by an ML microservice (Sentiment & Topic Detection), and is securely stored and presented in a React-based analytics dashboard.

---

## 🏗 Architecture & Tech Stack

### High-Level Flow
```
User / API (Feedback Submission) 
  → Node.js / Express (Backend API) 
      → Python / FastAPI (ML Microservice) 
          → Scikit-learn (TF-IDF + Logistic Regression)
      ← (Returns Sentiment, Confidence, Aspect)
  → MySQL (Database Storage & Indexing)
  → Nodemailer (Smart Alerts for critical feedback)
  → React / Tailwind CSS (Frontend Dashboard)
```

### Technology Decisions & "Why?"

| Component | Technology | Why it was chosen over alternatives? |
| :--- | :--- | :--- |
| **Frontend** | **React + Vite + Tailwind CSS** | Provides a fast, modern component-based UI. Tailwind CSS allows for rapid, professional SaaS-like styling without bloated CSS files. |
| **Backend API** | **Node.js + Express** | High concurrency and excellent I/O performance for handling incoming feedback streams. Structured using the MVC pattern (Routes, Controllers, Services) for clean, maintainable code. |
| **Database** | **MySQL** | Replaced the original SQLite. MySQL provides true concurrency (row-level locking), robust ACID transactions, and is ready for serverless PaaS deployment. We used `INSERT IGNORE` with unique constraints to mathematically eliminate a previous Time-Of-Check-Time-Of-Use (TOCTOU) race condition. |
| **ML/NLP Service** | **FastAPI (Python)** | Replaced Flask. FastAPI is significantly faster (using Starlette/Pydantic), strictly validates data types, and automatically generates Swagger UI documentation, demonstrating production-ready API design. |
| **ML Approach** | **Scikit-learn (TF-IDF + Logistic Regression)** | Replaced the rule-based VADER lexicon. A custom TF-IDF pipeline outputs real statistical probabilities (confidence scores) and feature importances. It is highly explainable, lightweight (no GPU required), and a textbook example of classical ML engineering. |

---

## ✨ Features
1. **Intelligent Sentiment Analysis**: Predicts Positive, Neutral, or Negative sentiment with exact confidence probabilities.
2. **Topic Detection**: Automatically categorizes feedback into domains (Product Quality, Customer Service, Delivery, etc.).
3. **Smart Alerts**: Calculates a Priority/Severity score. If highly negative feedback passes a specific threshold, it triggers an instant email alert to managers.
4. **Race-Condition-Free Batching**: Groups bulk CSV uploads and daily manual entries securely using SQL constraints.
5. **Advanced Dashboard**: Features server-side pagination, advanced multi-column filtering, and analytical data visualization.
6. **Workflow Management**: Update feedback statuses (`New`, `Reviewing`, `Resolved`, `Ignored`) directly from the dashboard.
7. **Unified Timezones**: Enforces strict UTC timestamps at the database and API levels, converting to local time only on the browser to prevent timezone drift.

---

## 🗄 Database Schema (MySQL)

- **`batches`**: Groups feedback together (e.g., a specific CSV upload, or "Manual Entries for Date X"). Uses a `UNIQUE` constraint on `label` to prevent race conditions during concurrent creations.
- **`reviews`**: The core table. Stores `review_text`, `sentiment`, `confidence`, `severity`, `aspect`, `status`, and `timestamp`. Linked to `batches` via a Foreign Key.
- **`settings`**: A simple Key-Value table for dynamic application settings (like `alert_threshold`).

---

## 🚀 Installation & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MySQL Server running locally

### 1. Database Setup
Ensure MySQL is running. The Node application will automatically initialize the database on first run, or you can run:
```bash
cd backend-node
node src/db/init.js
```

### 2. ML Service (FastAPI)
```bash
cd backend-python
# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn scikit-learn joblib pandas pydantic

# Train the initial ML models
python train_models.py

# Run the API
uvicorn app:app --host 0.0.0.0 --port 5001 --reload
```
*The ML API docs will be available at `http://localhost:5001/docs`.*

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
```

**`frontend/.env`**
```env
VITE_API_BASE=http://localhost:5000/api
```

*(Note: Never commit your actual `.env` files to Git. A `.env.example` is provided).*

---

## 📖 API Documentation (Node.js)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reviews` | Submit a single review for analysis. |
| `GET` | `/api/reviews` | Fetch reviews. Supports query params: `page`, `limit`, `search`, `sentiment`, `aspect`, `status`. |
| `PATCH` | `/api/reviews/:id/status` | Update the workflow status of a review. |
| `POST` | `/api/reviews/bulk` | Upload a CSV for bulk processing (multipart/form-data). |
| `GET` | `/api/stats` | Retrieve aggregated sentiment counts for charting. |
| `GET` | `/api/settings` | Get current platform settings (e.g., alert thresholds). |

---

## 🧪 Testing
*(Tests can be implemented using Jest/Supertest for Node.js, and PyTest for Python)*
- **Node.js**: Focus tests on the `feedbackService` to ensure race-conditions are mitigated and pagination mathematics are correct.
- **Python**: Focus tests on the `/predict` endpoint ensuring it handles empty strings, extremely long text, and returns correct Pydantic validation errors.

---

## 🚢 Deployment Strategy
Pulse is designed with a modern microservice deployment topology in mind:
- **Frontend**: Deploy to **Vercel** or **Netlify** (Static site hosting, fast CDN).
- **Node.js Backend**: Deploy to **Render** or **Railway** (Web service).
- **Python ML Service**: Deploy to **Render** or **Railway** (Web service).
- **Database**: Use a managed MySQL provider like **Aiven**, **PlanetScale**, or **Render MySQL**.

---

## 🔮 Future Improvements
- Add JWT-based Authentication (Admin vs Analyst roles).
- Implement WebSockets for real-time dashboard updates.
- Replace the Scikit-learn model with a fine-tuned Hugging Face Transformer (e.g., DistilBERT) for highly nuanced semantic understanding, deployed via ONNX for speed.
