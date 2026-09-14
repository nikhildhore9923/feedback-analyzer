# Pulse — Architecture & System Design Document

This document provides a comprehensive technical overview of the Pulse Customer Feedback Intelligence Platform.

## 1. High-Level Architecture (Microservices)

Pulse uses a modern, decoupled **3-Tier Microservice Architecture**. This allows the frontend, the core business API, and the heavy Machine Learning computations to scale independently.

```mermaid
graph TD
    Client[Browser / Client]
    
    subgraph Frontend [Tier 1: Vercel]
        React[React + Vite + Tailwind CSS]
    end

    subgraph Backend_Node [Tier 2: Render]
        NodeAPI[Node.js / Express API]
        Mailer[Resend HTTP API SMTP Service]
    end

    subgraph Backend_ML [Tier 3: Render]
        FastAPI[Python FastAPI]
        MLModel[Scikit-Learn TF-IDF Models]
    end

    subgraph Database [Database: Aiven]
        MySQL[(Aiven MySQL Cloud)]
    end

    Client -- HTTPS --> React
    React -- API Requests --> NodeAPI
    NodeAPI -- Async Alerts --> Mailer
    NodeAPI -- ML Inference Request --> FastAPI
    FastAPI -- JSON Response --> NodeAPI
    NodeAPI -- SQL Queries --> MySQL
```

## 2. Core Components

### A. Frontend (React / Vite)
*   **Role**: Provides the user interface (Dashboard) for analysts to view and manage feedback.
*   **Key Tech**: React, Vite, Tailwind CSS, Recharts.
*   **Responsibilities**:
    *   State management (filtering positive vs negative reviews).
    *   Data visualization (Donut charts, metric counters).
    *   Handling CSV file uploads via `FormData`.

### B. Business Logic API (Node.js / Express)
*   **Role**: Acts as the central traffic controller and orchestrator.
*   **Key Tech**: Node.js, Express, `mysql2/promise`, `Resend HTTP API`.
*   **Responsibilities**:
    *   Routing and REST API endpoints (`GET /reviews`, `POST /reviews`).
    *   Database CRUD operations.
    *   **Asynchronous Alerting**: Evaluates ML responses and fires off non-blocking background emails if a threshold is breached.

### C. Machine Learning Inference Service (Python / FastAPI)
*   **Role**: Isolated computational microservice responsible strictly for Natural Language Processing (NLP).
*   **Key Tech**: Python 3.11, FastAPI, Uvicorn, Scikit-Learn, Pandas.
*   **Responsibilities**:
    *   Loading pre-trained serialized models (`.pkl` files) into memory on startup.
    *   Exposing a high-speed REST endpoint (`/predict`) to vectorize incoming text via TF-IDF and run Logistic Regression predictions.

### D. Database (Aiven MySQL)
*   **Role**: Persistent storage of reviews, batches, and configuration settings.
*   **Key Tech**: MySQL 8.0 (Managed Cloud).
*   **Responsibilities**:
    *   Enforcing relational integrity (Foreign Keys between `reviews` and `batches`).
    *   Preventing race conditions via `UNIQUE` constraints.

---

## 3. Data Flow Diagram (Review Submission)

This diagram shows the exact sequence of events when a user submits a review.

```mermaid
sequenceDiagram
    participant User as React Frontend
    participant Node as Node.js API
    participant ML as Python FastAPI
    participant DB as MySQL DB
    participant Email as Gmail SMTP

    User->>Node: POST /api/reviews { text: "bad product" }
    Node->>ML: POST /predict { text: "bad product" }
    ML-->>Node: { sentiment: "Negative", confidence: 0.82 }
    
    Note over Node: Node checks threshold
    
    par Async Database Write
        Node->>DB: INSERT INTO reviews (sentiment, confidence...)
        DB-->>Node: OK (Review ID: 12)
    and Async Email Alert
        Node-)Email: sendMail() (Fire & Forget)
    end
    
    Node-->>User: 200 OK (Instant Response)
```

## 4. Key Engineering Decisions & Trade-offs

1.  **Asynchronous Email Alerts**: Sending emails via SMTP is slow and prone to timeouts (especially if credentials fail or the provider blocks the port). Instead of using `await` and freezing the user's browser, the email function is detached (Fire-and-Forget). The HTTP response is sent to the user immediately, and the email resolves in the background.
2.  **TF-IDF vs Deep Learning**: While LLMs (like GPT) are trendy, they are slow, expensive, and require GPUs. For a simple classification task (Sentiment/Aspect), a classical TF-IDF Vectorizer with Logistic Regression executes in single-digit milliseconds on a cheap 0.1 CPU cloud instance.
3.  **Database Concurrency**: To prevent duplicate "daily batches" from being created if multiple users upload CSVs at the exact same millisecond, the application relies on the database engine itself using `INSERT IGNORE` and a `UNIQUE` constraint on the batch label, avoiding traditional Time-Of-Check to Time-Of-Use (TOCTOU) bugs.
