# Pulse — Resume Bullet Points

When adding this project to your resume, you want to focus on **impact**, **architecture**, and **engineering decisions**, not just listing the languages you used. 

Here are three different ways to write it on your resume, depending on how much space you have.

### Option 1: The "Full-Stack Engineer" Focus (Recommended)

**Pulse: AI-Powered Customer Intelligence Platform** | *React, Node.js, Express, Python, MySQL, Render* 
* Designed and deployed a 3-tier microservice architecture to ingest, analyze, and visualize customer feedback streams in real-time.
* Engineered a decoupled Python FastAPI machine learning service using Scikit-Learn (TF-IDF & Logistic Regression) to classify sentiment and categorize topics with strict mathematical confidence scores.
* Built a high-performance Node.js API to orchestrate database writes and trigger asynchronous, non-blocking email alerts for critical negative reviews using Nodemailer.
* Ensured data integrity and prevented concurrent race conditions by implementing unique constraints and idempotent SQL operations on an Aiven Cloud MySQL database.
* Automated deployment via GitHub CI/CD pipelines to Vercel (Frontend) and Render (Backend Web Services).

### Option 2: The "Machine Learning / Data" Focus

**Pulse: Customer Feedback NLP Engine** | *Python, FastAPI, Scikit-Learn, Node.js, React, SQL*
* Developed a lightweight, low-latency Natural Language Processing (NLP) microservice using Python, FastAPI, and Scikit-Learn to analyze customer feedback at scale.
* Trained TF-IDF vectorizers and Logistic Regression pipelines to perform multi-class topic categorization and sentiment analysis, avoiding the overhead of heavy deep learning models.
* Integrated the ML engine with a Node.js REST API that aggregates data, stores it in a relational MySQL database, and visualizes statistical trends via a React/Tailwind dashboard.
* Configured automated background alerting to instantly notify management of severe customer complaints based on model confidence and severity thresholds.

### Option 3: Short & Punchy (If you are low on space)

**Pulse: AI Feedback Analyzer** | *React, Node.js, Python FastAPI, Scikit-Learn, MySQL*
* Built a distributed microservice platform to analyze customer feedback sentiment and automatically route critical alerts.
* Trained and deployed a Scikit-Learn NLP model (TF-IDF) behind a high-speed Python FastAPI microservice.
* Created a responsive React dashboard to visualize ML inferences stored securely in an Aiven MySQL cloud database.
