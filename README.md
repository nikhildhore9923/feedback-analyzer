# Customer Feedback Analyzer — Setup Guide

You need **3 terminals open at once**, one for each service.

## Terminal 1 — Python ML service (port 5001)
```
cd backend-python
pip install -r requirements.txt
python app.py
```
You should see: `Running on http://127.0.0.1:5001`

## Terminal 2 — Node/Express backend (port 5000)
```
cd backend-node
npm install
npm start
```
You should see: `Node server running on http://localhost:5000`

## Terminal 3 — React frontend (port 5173)
```
cd frontend
npm install
npm run dev
```
Open the URL it gives you (usually http://localhost:5173) in your browser.

## Test it
1. Type a review like "The product arrived late but support was great" and submit.
2. It should appear in the table below with a sentiment + aspect tag.
3. The pie chart updates automatically.
4. Try the CSV upload: make a file with one column header `review` and a few rows of review text under it.

## Pages
- **Dashboard** (`/`) — submit reviews, live sentiment signal, category breakdown, 5 most recent reviews
- **Reviews** (`/reviews`) — full searchable/filterable log, upload history (batches), delete individual reviews, export everything to CSV
- **Settings** (`/settings`) — adjust the alert threshold (stored in the database, survives restarts)

## Important: if you already have a feedback.db file
This update adds new database columns and a new `batches` table. SQLite won't
add columns to an existing table automatically. If you ran an earlier version of
this project before, **delete `backend-node/feedback.db`** before starting the
server again - it will recreate the database fresh with the correct structure.
(You'll lose old test data, but that's expected - it's just test data.)

## Order matters
Always start Python first, then Node, then React. Node calls Python — if Python
isn't running, submitting a review will fail with a clear error in the browser.

## Email alerts (optional)
Highly negative reviews (polarity below -0.5) automatically trigger an email to a manager.

1. In `backend-node/`, copy `.env.example` to `.env`.
2. Turn on 2-Step Verification on your Google account, then generate an App Password at
   https://myaccount.google.com/apppasswords
3. Fill in `EMAIL_USER`, `EMAIL_PASS` (the 16-character app password, not your real Gmail
   password), and `ALERT_TO` in `.env`.
4. Restart the Node server.

If you skip this setup, the app still works fully — it just logs
`[mailer] Skipped alert (email not configured)` to the Node terminal instead of sending.
That's a deliberate design choice so the project never crashes for someone without email set up.
