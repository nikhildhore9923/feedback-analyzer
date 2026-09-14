# Pulse — Interview Preparation Guide

This guide is designed to help you confidently explain and defend your engineering decisions for the Pulse project in an AI/ML or Full-Stack Software Engineering interview.

---

## ⏱ 60–90 Second Elevator Pitch (Memorize This)

*"For my final-year project, I built **Pulse**, a Customer Feedback Intelligence Platform. 
The goal was to move beyond a simple CRUD app and build a system that automatically reads, analyzes, and categorizes customer feedback streams in real-time.*

*The architecture is split into microservices. The frontend is a React dashboard built with Tailwind CSS that allows analysts to view sentiment trends and filter feedback. When feedback is submitted, it hits a Node.js and Express backend. The Node server handles business logic—like saving to a MySQL database and firing off smart email alerts for critical issues.*

*However, the actual intelligence happens in a separate Python microservice built with FastAPI. I trained a Scikit-Learn Machine Learning model using TF-IDF and Logistic Regression. Instead of just returning 'positive' or 'negative', it returns a strict mathematical confidence probability and automatically detects the topic—like 'Pricing' or 'Delivery'.*

*I focused heavily on production engineering: I fixed a severe race condition in the database using SQL unique constraints, enforced strict UTC timezone handling across the stack, and separated my Node code into an MVC pattern. It’s designed to be a realistic, deployable SaaS product rather than just a college demo."*

---

## 🧠 Top 30 Interview Questions & Answers

### Architecture & Design Decisions
**1. Why did you split the backend into Node.js and Python? Why not just use one?**
*Answer:* Separation of concerns. Node.js is asynchronous and incredibly fast at I/O operations—perfect for handling API requests, database writes, and email alerts. Python is the industry standard for Data Science and Machine Learning. By splitting them, I could use the best tool for each job, allowing the ML service to scale independently if it gets CPU-bound.

**2. Why did you choose MySQL over MongoDB or SQLite?**
*Answer:* I initially looked at SQLite, but it locks the entire database on writes, which hurts concurrency. I chose MySQL because customer feedback data is highly structured (reviews, batches, statuses) and relational. MySQL provides true row-level locking, ACID compliance, and handles concurrent connections safely, which is critical for a production environment.

**3. What is the MVC pattern and how did you use it in Node.js?**
*Answer:* MVC stands for Model-View-Controller. In my Node backend, the `Routes` define the API endpoints, the `Controllers` handle the HTTP requests and responses, and the `Services` contain the actual business logic (like deciding if an email alert should be sent). The `DB` layer handles the data. This keeps the code modular and testable.

### Backend: Node.js, Express & REST API
**4. How did you handle errors in your Express API?**
*Answer:* I implemented a centralized Error Handling middleware. Instead of having `try/catch` blocks crash the server or send raw stack traces to the user, errors are passed using `next(err)`. The central middleware catches them, logs them securely, and returns a standardized JSON format with proper HTTP status codes.

**5. What is CORS and why is it important in your project?**
*Answer:* Cross-Origin Resource Sharing (CORS) is a browser security feature. Because my React frontend runs on a different port/domain than my Node backend, the browser would block the requests. I configured the `cors` middleware in Express to explicitly allow my frontend to communicate with my API safely.

**6. How did you implement Pagination on the backend?**
*Answer:* Instead of sending thousands of rows to the browser, my API accepts `page` and `limit` query parameters. In MySQL, I calculate the `OFFSET` based on the page number and use the `LIMIT` clause. I also run a separate `COUNT(*)` query to return the total number of records so the frontend knows how many pages exist.

### Database, Concurrency & Timestamps
**7. You mentioned fixing a Race Condition. What was the issue and how did you fix it?**
*Answer:* The old code had a TOCTOU (Time-Of-Check to Time-Of-Use) bug. When a user submitted a manual review, it checked if a batch existed for today, and if not, created one. If two requests came in at the exact same millisecond, they both saw no batch and both created one, resulting in duplicates. I fixed it by adding a `UNIQUE` constraint on the batch label in MySQL and using `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE`. This delegates the atomic check to the database engine.

**8. Dealing with Timezones is notoriously difficult. How did you handle it?**
*Answer:* I enforced a strict UTC-only policy on the backend. MySQL uses `CURRENT_TIMESTAMP` which is UTC, and Node.js sends the ISO string. The timezone is only converted to the user's local time at the very last step in the browser using JavaScript’s `Date` formatting.

**9. What are SQL Injections and how did you prevent them?**
*Answer:* SQL injection is when a malicious user inputs SQL commands into a text field to manipulate the database. I prevented this by exclusively using parameterized queries (Prepared Statements) with the `mysql2` package. It strictly separates the SQL logic from the user data.

### Machine Learning, NLP & Python
**10. Why did you choose Scikit-Learn (TF-IDF + Logistic Regression) over a Deep Learning/LLM approach?**
*Answer:* For this specific task, classical ML is highly efficient. Deep Learning or LLMs require GPUs, introduce latency, and are "black boxes." TF-IDF with Logistic Regression is lightweight, lightning-fast for inference, and highly explainable—I can extract the exact feature weights to see *why* the model predicted a specific sentiment. It's the perfect engineering choice for a fast, reliable microservice.

**11. What exactly is TF-IDF?**
*Answer:* It stands for Term Frequency-Inverse Document Frequency. It's a technique to vectorize text. It counts how many times a word appears in a review (Term Frequency), but penalizes words that appear frequently across *all* reviews (like "the" or "and") using Inverse Document Frequency. This highlights the words that are actually important.

**12. How does your model generate a "Confidence Score"?**
*Answer:* Because I used Logistic Regression, the model uses the Sigmoid/Softmax function. Instead of just outputting a hard class label (Positive/Negative), it outputs a probability distribution across the classes (e.g., 85% Positive, 10% Neutral, 5% Negative). I extract the maximum probability and surface that as the Confidence Score.

**13. Why did you use FastAPI instead of Flask?**
*Answer:* FastAPI is significantly faster because it's built on ASGI (Starlette). It also uses Pydantic for strict data validation—if a request is missing the "text" field, FastAPI automatically throws a 422 error before my code even runs. Plus, it auto-generates Swagger API documentation, which is great for a professional service.

**14. How did you handle topic/category detection?**
*Answer:* I treated it as a Multi-class Classification problem. I trained a second ML pipeline (also TF-IDF + Logistic Regression) labeled with specific categories like "Pricing", "Delivery", or "Product Quality". When text comes in, the model predicts the most statistically likely category based on the vocabulary.

### Frontend (React & Tailwind)
**15. Why use React for the frontend?**
*Answer:* React's component-based architecture allowed me to build a dynamic, single-page application. When users filter reviews or change a status, React updates the UI instantly without reloading the page, which is essential for a smooth dashboard experience.

**16. Why did you choose Tailwind CSS?**
*Answer:* Tailwind is a utility-first CSS framework. It allowed me to rapidly style the dashboard directly in my JSX without having to manage huge, confusing external CSS files or worry about class-name collisions. It keeps the bundle size small because it purges unused CSS during the build process.

**17. How do you handle State Management in your React app?**
*Answer:* I kept it simple using standard React hooks (`useState` and `useEffect`). Since the application isn't overly complex, introducing Redux would be over-engineering. I pass state down via props where necessary.

**18. What happens if the API request fails in the frontend?**
*Answer:* I manage a `loading` and `error` state. If the API fails (e.g., the Python service is down), the `catch` block triggers, stopping the loading spinner and displaying a graceful, user-friendly error message rather than breaking the application.

### General Engineering & Architecture
**19. What is a Microservice Architecture?**
*Answer:* It's an approach where an application is built as a collection of small, independent services communicating over APIs. In my project, the Node API and Python ML API are microservices. This means if the ML service crashes, the Node server can still serve the dashboard (degraded gracefully), and they can be deployed and scaled separately.

**20. What would happen to your application if it received 10,000 reviews per minute? (Scalability)**
*Answer:* The Node.js server can handle high concurrent I/O. The bottleneck would be the Python ML service. Because they are decoupled, I could scale horizontally by spinning up 5 instances of the Python FastAPI service behind a Load Balancer, while keeping just 1 or 2 Node instances.

**21. How does your Smart Alert system work?**
*Answer:* The Node server checks the ML response. If the sentiment is Negative, it calculates a Priority Score (Confidence * Severity). If this score exceeds a database-configured threshold, it asynchronously triggers Nodemailer to send a warning email to management.

**22. You mentioned "Idempotency". What does that mean in your app?**
*Answer:* Idempotency means doing something multiple times has the same effect as doing it once. My database batch creation is idempotent—if I tell the database "Create a manual batch for today" 5 times, the `INSERT IGNORE` ensures it only ever creates 1 batch.

**23. Why shouldn't you commit your `.env` files to GitHub?**
*Answer:* `.env` files contain secrets like Database passwords and Email credentials. Committing them would leak sensitive information to the public, posing a massive security risk.

**24. If I look at your code, I see you didn't implement Authentication. Why?**
*Answer:* I evaluated it, but decided to prioritize the core architectural quality, the ML pipeline, and fixing the database race conditions. Implementing proper JWT Auth requires significant overhead (user tables, token invalidation, middleware). For a portfolio project focused on ML and architecture, I wanted to ensure the core was perfect rather than spreading myself too thin. (This shows excellent engineering prioritization).

**25. How do you ensure your machine learning model is actually good?**
*Answer:* Before deploying, the model is evaluated using metrics like Accuracy, Precision, Recall, and F1-Score on a test dataset. Because customer feedback often has class imbalances (e.g., mostly positive reviews), F1-Score is a better metric than raw accuracy.

**26. How do you handle empty or extremely long text inputs in the ML service?**
*Answer:* The FastAPI service uses Pydantic to validate input. If the string is empty, it returns an HTTP 400 Bad Request immediately. For extremely long text, TF-IDF naturally handles it by vectorizing the token counts, though in a real system, I would cap the character limit at the API level to prevent memory exhaustion (DoS attacks).

**27. Describe how you would deploy this project.**
*Answer:* I'd deploy the React frontend to Vercel for fast global CDN delivery. The Node.js and Python APIs would be deployed as Web Services on Render or Railway. The database would be hosted on a managed service like PlanetScale or Aiven.

**28. What was the hardest part of building this project?**
*Answer:* (Pick one that feels true to you! A good example: "Debugging the race condition where duplicate batches were being created. It taught me that application-level checks aren't enough when concurrency is involved, and you must rely on database constraints.")

**29. How does Vite compare to Create React App (CRA)?**
*Answer:* Vite is significantly faster. CRA uses Webpack, which bundles the entire application before the dev server starts. Vite uses native ES modules in the browser and esbuild (written in Go), so it starts instantly and updates modules almost immediately.

**30. If you had 2 more weeks to work on this, what would you add?**
*Answer:* I would implement a message queue (like RabbitMQ or Redis/Bull). Right now, the CSV bulk upload waits for the ML service to process every row synchronously. With a queue, I could accept the file instantly, process the ML inference in the background asynchronously, and notify the frontend via WebSockets when it's done.
