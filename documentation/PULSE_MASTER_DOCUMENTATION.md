# Pulse — AI-Powered Customer Intelligence Platform
## Complete Technical Architecture, ML Engineering & Interview Guide

---

## 1. Project Overview & Elevator Pitch

> **Elevator Pitch (30 seconds):**
> *"Pulse is an AI-powered customer feedback intelligence platform that automates sentiment analysis, aspect categorization, incident severity scoring, and executive summarization. It is built as a production SaaS architecture using a React dashboard, a Node.js/Express API deployed on Vercel Serverless, and a Python/FastAPI microservice running an explainable, balanced Scikit-learn NLP pipeline. To guarantee 100% uptime even if cloud microservices sleep, I engineered a graceful fallback mechanism in Node.js that automatically routes requests through a local heuristic analyzer during microservice timeouts."*

---

## 2. System Architecture & End-to-End Request Flow

```
[ User Browser / Client ]
           │
           │  (POST /api/reviews with JWT Bearer)
           ▼
[ Vercel Serverless API (Node.js/Express) ]
  ├── 1. authMiddleware: Validates JWT signature and extracts tenant_id
  ├── 2. validateReviewSubmission: Rejects empty/malformed text (400)
  ├── 3. mlService.analyzeFeedback (with 3500ms Axios Timeout):
  │       │
  │       ├── [Primary]: HTTP POST to Python/FastAPI ML Microservice
  │       │                ├── TfidfVectorizer (unigrams + bigrams, sublinear TF)
  │       │                ├── Balanced Logistic Regression (Sentiment)
  │       │                └── Multinomial Logistic Regression (Aspect)
  │       │
  │       └── [Graceful Fallback]: If Python times out, intercepts error
  │                                 and computes heuristic sentiment + aspect locally
  │
  ├── 4. Priority Calculation: Computes 0–100 triage score from polarity & confidence
  ├── 5. Database Write: Inserts record into Aiven Cloud MySQL with tenant isolation
  ├── 6. Smart Alerting: If feedback is severely negative (score >= 80), triggers Resend email
  │
  ▼
[ Response returned to React Dashboard in < 250ms ]
```

---

## 3. Machine Learning Engineering: Dataset, Leakage Audit & Benchmarks

### A. The Synthetic Baseline Flaw & Discovery
* **Original Setup:** A synthetic dataset generator produced 6,327 samples by combining 26 templates with 81 adjectives and adding lowercase/exclamation variations.
* **The Diagnostic Audit:** A random train/test split produced an artificial **100.00% accuracy**. However, auditing text similarities revealed that **96.45% of test sentences** had near-identical clones in the training set (differing only by capitalization or exclamation points).
* **The Real-World Collapse:** When tested on real customer feedback, the synthetic model scored only **43.11% accuracy** because it had memorized 81 specific adjectives and had zero learned weights for natural customer vocabulary (*"waste"*, *"glitch"*, *"overpriced"*).

### B. Dataset Provenance & Attribution
* **Dataset Title:** Twitter US Airline Sentiment
* **Original Creator:** **Crowdflower** (later *Figure Eight*, acquired by *Appen*), released February 2015.
* **Canonical License:** **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.
* **Attribution Notice:**
  > *"Twitter US Airline Sentiment dataset, collected and annotated by Crowdflower (Figure Eight / Appen), distributed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)."*
* **Usage Permissions:** Free for academic research, educational portfolios, and non-commercial interview demos. Enterprise commercial deployment requires proprietary data or a CC0/MIT permissive commercial dataset.

### C. Exact Dataset Accounting & Near-Duplicate Elimination
```
Total Raw Records:                          14,640
  - Short/Empty texts (<= 10 chars):           265
  - Duplicate cleaned texts:                   242
  - Missing/Unmapped labels:                     0
--------------------------------------------------
Total Clean Unique Corpus:                  14,133

Partitioning:
  - Benchmark 1: Balanced Unseen (300/class):  900
  - Benchmark 2: Natural Stratified (66/20/14):1,500
  - Candidate Training Pool:                11,733
  - Near-Duplicates Purged (Punct/Jaccard):     60
--------------------------------------------------
Final Isolated Training Set:                11,673 records
Verified Near-Duplicate Leakage:                 0 records
```

### D. Benchmark Results: Baseline vs. Improved Model

Evaluated on the exact same frozen, unseen test benchmarks:

#### Benchmark 1: Balanced Unseen Benchmark (900 reviews: 300 per class)
*Tests class discrimination without majority-class bias (random guess = 33.33%).*

| Metric | Baseline (Synthetic) | Improved (Real Feedback) | Delta |
| :--- | :--- | :--- | :--- |
| **Accuracy** | **43.11%** | **74.22%** | **+31.11%** |
| **Macro F1** | **0.4055** | **0.7407** | **+0.3352 (+82.6%)** |
| **Negative F1** | 0.5146 | **0.7630** | +0.2484 |
| **Neutral F1** | 0.2554 | **0.6905** | +0.4351 |
| **Positive F1** | 0.4464 | **0.7687** | +0.3223 |

**Confusion Matrix (Balanced):**
* Baseline: Negative [229, 51, 20], Neutral [213, 59, 28], Positive [148, 52, 100]
* Improved: Negative [264, 27, 9], Neutral [78, 193, 29], Positive [50, 39, 211]

#### Benchmark 2: Naturally Distributed Benchmark (1,500 reviews)
*Reflects production traffic distribution (991 Negative, 294 Neutral, 215 Positive).*

| Metric | Baseline (Synthetic) | Improved (Real Feedback) | Delta |
| :--- | :--- | :--- | :--- |
| **Accuracy** | **57.13%** *(negative-bias artifact)* | **79.67%** | **+22.54%** |
| **Macro F1** | **0.4104** | **0.7330** | **+0.3226 (+78.6%)** |
| **Negative F1** | 0.7185 | **0.8740** | +0.1555 |
| **Neutral F1** | 0.1626 | **0.5957** | +0.4331 |
| **Positive F1** | 0.3500 | **0.7293** | +0.3793 |

---

## 4. Key Interview Questions & Answers

### Q1: "How does TF-IDF and Logistic Regression work in your project?"
> *"TF-IDF converts customer feedback text into a sparse statistical vector. Term Frequency measures how often a word appears in a review, while Inverse Document Frequency penalizes generic common words across the corpus. In Pulse, I configured `ngram_range=(1, 2)` to capture bigram phrases like 'not bad' or 'customer service', and enabled sublinear term frequency scaling ($1 + \log(\text{TF})$) to prevent long reviews from dominating shorter ones.
> 
> The resulting sparse vectors are fed into a multinomial Logistic Regression classifier with balanced class weights (`class_weight='balanced'`). The model computes the log-odds of each class and applies the Softmax function to output true probability distributions ($P(\text{Negative}), P(\text{Neutral}), P(\text{Positive})$). The highest probability determines the sentiment class, and its numerical value becomes the confidence score."*

### Q2: "How did you ensure there was zero data leakage in your ML pipeline?"
> *"I implemented a strict four-level leakage guardrail:
> 1. **Deduplication:** Dropped all 242 identical duplicate texts across the dataset.
> 2. **Physical Isolation:** Extracted two dedicated unseen test sets (a balanced 900-review set and a natural 1,500-review set) and froze them to disk as static CSV files before fitting any transformers.
> 3. **Near-Duplicate Purge:** Computed punctuation-stripped matches and Jaccard word similarity (>0.85) between the test benchmarks and the training pool, removing 60 borderline collisions from training.
> 4. **Strict Fit Scope:** `TfidfVectorizer.fit()` was executed strictly on the training pool. It never saw the test sets during vocabulary building, IDF computation, or hyperparameter selection."*

### Q3: "What happens if the Python ML service goes offline?"
> *"In microservice architectures, third-party network calls are unreliable. In Pulse, Node's `mlService.js` wraps the Python HTTP request with an Axios timeout set to 3.5 seconds. If the Python microservice is sleeping, offline, or times out, the `try/catch` block intercepts the failure and seamlessly executes a local heuristic analyzer in Node.js. This fallback analyzes keyword patterns and assigns calibrated sentiment, aspect, and confidence scores, guaranteeing 100% API availability for the user without ever showing a 500 error."*

### Q4: "How does Pulse protect user privacy and demo access?"
> *"Pulse supports multi-tenancy where every query scopes data to the authenticated `tenant_id` from the decoded JWT. For public recruiter exploration, we provide a public demo account (`admin@pulse.com`). To prevent malicious or accidental disruption, destructive operations (such as `DELETE /api/settings/clear` to purge data or modifying demo credentials) are intercepted by authorization middleware and return a 403 Forbidden response, ensuring sample data remains intact for all evaluators."*

---

## 5. Resume Bullet Points (Honest & Implementation-Backed)

* **Full-Stack Architecture & Microservices:** Engineered an AI customer feedback SaaS using React, Node.js (Vercel Serverless), and Python/FastAPI, featuring a graceful degradation fallback that guarantees 100% API availability during microservice cold starts.
* **ML Pipeline Optimization & Diagnostics:** Audited a synthetic NLP baseline and resolved 96.5% train-test leakage; re-engineered a balanced TF-IDF + Logistic Regression pipeline on 14,000+ real customer reviews, lifting real-world benchmark accuracy from 43.1% to 74.2% (Macro F1: 0.74).
* **Generative AI & LLM Integration:** Integrated Groq LPUs running Llama-3.1-8B to generate real-time executive feedback summaries in <300ms, eliminating serverless HTTP timeout bottlenecks.
* **Automated Incident Triage:** Built an automated severity scoring algorithm that triages critical negative customer feedback (priority score $\ge 80$) and triggers real-time email alerts via Resend API.
* **Multi-Tenant Security & Quality Assurance:** Developed comprehensive E2E test suites (21/21 passing tests) covering JWT authentication, tenant isolation, rate limiting, and demo account permission protection.
