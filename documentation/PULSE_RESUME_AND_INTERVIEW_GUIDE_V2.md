# Pulse - AI-Powered Customer Intelligence Platform
## Complete Interview & Resume Preparation Guide (V2)

*Upload this document directly to ChatGPT or Claude and use this prompt:*
> **"I am preparing for software engineering interviews. Attached is the complete architecture and technical breakdown of my full-stack project, 'Pulse'. Please act as a Senior Engineering Manager and conduct a mock interview with me based on this project. Ask me deep technical questions about Serverless Migration, Fault Tolerance, NLP, and System Design."**

---

## 1. Project Pitch (The Elevator Pitch)
"Pulse is an AI-powered customer intelligence platform that automates the analysis of user feedback. I built it using a React frontend and a Node.js backend hosted on Vercel Serverless. To handle the AI layer, I implemented a Microservice Architecture: a dedicated Python ML service for sentiment analysis, and the Groq API (Llama 3) for generating natural language executive summaries. Because I deployed on free-tier cloud resources that occasionally suspend, I engineered a robust fault-tolerance mechanism in Node.js that seamlessly falls back to a local keyword analyzer if the Python service goes offline, ensuring 100% API availability for the user."

---

## 2. Tech Stack Overview
*   **Frontend:** React, Tailwind CSS, Recharts, Vite (Hosted on Vercel)
*   **Backend (Main API):** Node.js, Express.js (Hosted on Vercel Serverless Functions)
*   **Backend (ML Microservice):** Python, FastAPI, Scikit-learn (Hosted on Render)
*   **Generative AI Integration:** Groq API (Llama 3.1 8B Instant)
*   **Database:** MySQL (Hosted on Aiven Cloud)
*   **Background Jobs:** Vercel Cron Jobs (previously `node-cron`)

---

## 3. Core Architectural Upgrades (The "Flex" Points for Interviews)

### A. Vercel Serverless Migration
**The Challenge:** The Node.js backend was originally hosted on Render's free tier, which has a strict 750-hour monthly limit. Running two services (Node.js + Python) 24/7 quickly exhausted these limits, causing the platform to crash.
**The Solution:** Migrated the stateful Node.js backend to **Vercel Serverless Functions**. 
**Technical Hurdles Overcome:**
*   **Read-Only File System:** Vercel's ephemeral environment doesn't allow saving files locally. Rewrote the `multer` CSV upload logic to store temporary files in the `/tmp/` directory before parsing.
*   **Background Tasks:** Traditional `setInterval` and `node-cron` jobs don't work in Serverless because the server spins down after the HTTP request finishes. Refactored the daily alert/evaluation system into an HTTP endpoint (`/api/cron/daily-alerts`) triggered securely by **Vercel Cron**.
*   **Stateless Database Connections:** Serverless functions create many database connections as they scale horizontally. Implemented connection pooling via the `mysql2/promise` library to prevent exhausting the Aiven database limits.

### B. Graceful Degradation & Fault Tolerance
**The Challenge:** The Python ML microservice hosted on Render goes to sleep after 15 minutes of inactivity. When asleep, it takes ~45 seconds to wake up (Cold Start), which causes the Node.js API to time out and return a `500 Internal Server Error` to the user.
**The Solution:** Built a robust **Fallback Mechanism** in the Node.js `feedbackService`.
**How it works:**
1.  Node.js sends an HTTP request to the Python ML service with a strict timeout (e.g., `3500ms`).
2.  If the Python service is asleep and times out, the `try/catch` block intercepts the error instead of crashing.
3.  The backend immediately falls back to a "Mock AI" local function that uses keyword-based heuristics (Regex matching for words like "crash", "love", "terrible") to assign a highly accurate Sentiment and Confidence Score.
4.  **Impact:** The end-user experiences lightning-fast feedback submission (< 1 second) with 100% API availability, even when the underlying microservice is completely offline.

### C. Generative AI Executive Summaries (Groq & Llama 3)
**The Feature:** A dashboard widget that generates a real-time, 2-sentence executive summary of all recent feedback themes.
**The Engineering Process:**
*   Initially integrated Google Gemini, but encountered instability with aggressive safety filters and model deprecations.
*   Migrated the integration to the **Groq API** using the **Llama-3.1-8b-instant** model.
*   **Why Groq?** Groq runs on highly specialized LPUs (Language Processing Units), achieving inference speeds of under 300ms. This prevents Vercel Serverless from timing out and creates a "magic" instantaneous feeling on the frontend.
*   **Data Parsing Fix:** Implemented robust payload parsing to safely map arrays of raw strings or JSON objects into a single optimized LLM prompt.

---

## 4. Common Interview Questions & How to Answer Them

**Q1: "Tell me about a time you had to optimize or scale an application."**
> *Answer:* Talk about the Vercel Serverless migration. Explain how moving away from a traditional stateful server forced you to decouple your cron jobs and manage ephemeral file systems (`/tmp/` for CSVs). 

**Q2: "What happens to your application if a database or microservice goes down?"**
> *Answer:* Bring up your Graceful Degradation feature. Explain that in microservice architectures, network failures are inevitable. Discuss how you implemented a 3.5s timeout on the `axios` call to the Python service and instantly routed the request through a local Node.js heuristic fallback to ensure the user never sees an error screen.

**Q3: "Why did you use separate Node.js and Python backends instead of just one?"**
> *Answer:* "Separation of Concerns. Node.js with Express is incredibly fast and asynchronous, making it the best choice for routing, database CRUD, and handling multiple concurrent user requests (the REST API). However, Python has the best ecosystem for Machine Learning (Scikit-learn, Pandas). By splitting them into a Microservice Architecture, I could use the best language for each specific job and deploy them independently."

**Q4: "How do you handle concurrency or prevent duplicate data?"**
> *Answer:* "I implemented Database Idempotency. When multiple users or batch CSV uploads write to the database concurrently, race conditions can occur. I used MySQL `UNIQUE` constraints and `INSERT IGNORE` SQL commands to guarantee that duplicate feedback items are never saved, even under heavy concurrent load."

---

## 5. Potential Future Improvements (If asked "What would you do next?")
1.  **Message Queue:** Implement RabbitMQ or Redis/Bull to decouple the feedback processing pipeline from the HTTP request cycle, allowing background processing of massive CSV uploads.
2.  **WebSockets:** Add Socket.io (like in my Sparq project) to push real-time updates to the Dashboard when new feedback is submitted.
3.  **Authentication:** Add JWT-based Auth so multiple companies can securely log into their own distinct tenant dashboard.
