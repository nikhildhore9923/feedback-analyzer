require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const { sendAlertEmail } = require("./mailer");

// A review this negative triggers an automatic email alert to the manager.
const URGENT_POLARITY_THRESHOLD = -0.5;

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5001/predict";

app.use(cors());
app.use(express.json());

// ---------- DATABASE SETUP ----------
// Using SQLite so you don't need to install/configure MySQL/Postgres to get started.
// On your resume you'd say "SQL database" - SQLite IS SQL, just file-based.
// If you want, we can swap this to MySQL/Postgres later, the queries barely change.
const db = new sqlite3.Database("./feedback.db");

db.serialize(() => {
  // Every CSV upload = one batch. Manual entries get grouped into one
  // "Manual entries" batch per calendar day, so you're not creating a new
  // batch every single time you type one review.
  db.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_text TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      polarity REAL,
      aspect TEXT,
      alert_sent INTEGER DEFAULT 0,
      batch_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    )
  `);

  // Simple key-value settings table. Storing settings in the DB (not just the
  // frontend) means they survive server restarts and would work even if two
  // people used the dashboard from different browsers.
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Seed the default threshold once, if it doesn't already exist.
  db.run(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('alert_threshold', ?)`,
    [String(URGENT_POLARITY_THRESHOLD)]
  );
});

function getAlertThreshold() {
  return new Promise((resolve) => {
    db.get(`SELECT value FROM settings WHERE key = 'alert_threshold'`, [], (err, row) => {
      if (err || !row) return resolve(URGENT_POLARITY_THRESHOLD);
      resolve(parseFloat(row.value));
    });
  });
}

// Finds today's "Manual entries" batch, or creates one if it doesn't exist yet.
function getOrCreateManualBatch() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const label = `Manual entries — ${today}`;

  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM batches WHERE type = 'manual' AND label = ?`,
      [label],
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(row.id);

        db.run(
          `INSERT INTO batches (label, type) VALUES (?, 'manual')`,
          [label],
          function (err) {
            if (err) return reject(err);
            resolve(this.lastID);
          }
        );
      }
    );
  });
}

// Always creates a brand new batch for a CSV upload, named after the file.
function createCsvBatch(filename) {
  const label = `${filename} — ${new Date().toLocaleString()}`;
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO batches (label, type) VALUES (?, 'csv')`, [label], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

// ---------- ROUTES ----------

// 1. Submit a single review
app.post("/api/reviews", async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Review text is required" });
  }

  try {
    // Node calls the Python ML microservice
    const mlResponse = await axios.post(PYTHON_SERVICE_URL, { text });
    const { sentiment, polarity, aspect } = mlResponse.data;

    // Fire off the alert email BEFORE saving, so we know whether to record alert_sent.
    const threshold = await getAlertThreshold();
    let alertSent = false;
    if (polarity < threshold) {
      alertSent = await sendAlertEmail(text, polarity, aspect);
    }

    const batchId = await getOrCreateManualBatch();

    db.run(
      `INSERT INTO reviews (review_text, sentiment, polarity, aspect, alert_sent, batch_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [text, sentiment, polarity, aspect, alertSent ? 1 : 0, batchId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          id: this.lastID,
          text,
          sentiment,
          polarity,
          aspect,
          alertSent,
          batchId
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not reach ML service" });
  }
});

// 2. Get all reviews - supports optional search + filters via query params
//    e.g. /api/reviews?search=late&sentiment=Negative&aspect=Delivery
app.get("/api/reviews", (req, res) => {
  const { search, sentiment, aspect, batch_id } = req.query;

  let query = `SELECT * FROM reviews WHERE 1=1`;
  const params = [];

  if (search) {
    query += ` AND review_text LIKE ?`;
    params.push(`%${search}%`);
  }
  if (sentiment) {
    query += ` AND sentiment = ?`;
    params.push(sentiment);
  }
  if (aspect) {
    query += ` AND aspect = ?`;
    params.push(aspect);
  }
  if (batch_id) {
    query += ` AND batch_id = ?`;
    params.push(batch_id);
  }

  query += ` ORDER BY timestamp DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2b. Delete a single review
app.delete("/api/reviews/:id", (req, res) => {
  db.run(`DELETE FROM reviews WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Review not found" });
    res.json({ message: "Deleted", id: req.params.id });
  });
});

// 3. Get aggregated stats (for pie chart)
app.get("/api/stats", (req, res) => {
  db.all(
    `SELECT sentiment, COUNT(*) as count FROM reviews GROUP BY sentiment`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 4. Bulk upload via CSV (Feature 4)
const upload = multer({ dest: "uploads/" });

app.post("/api/reviews/bulk", upload.single("file"), async (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      // Expecting the CSV to have a column literally named "review"
      if (row.review) results.push(row.review);
    })
    .on("end", async () => {
      let inserted = 0;
      const threshold = await getAlertThreshold();
      const batchId = await createCsvBatch(req.file.originalname);

      for (const text of results) {
        try {
          const mlResponse = await axios.post(PYTHON_SERVICE_URL, { text });
          const { sentiment, polarity, aspect } = mlResponse.data;

          let alertSent = false;
          if (polarity < threshold) {
            alertSent = await sendAlertEmail(text, polarity, aspect);
          }

          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO reviews (review_text, sentiment, polarity, aspect, alert_sent, batch_id) VALUES (?, ?, ?, ?, ?, ?)`,
              [text, sentiment, polarity, aspect, alertSent ? 1 : 0, batchId],
              (err) => (err ? reject(err) : resolve())
            );
          });
          inserted++;
        } catch (e) {
          console.error("Row failed:", e.message);
        }
      }

      fs.unlinkSync(req.file.path); // clean up the temp uploaded file
      res.json({ message: `Processed ${inserted} reviews from CSV`, batchId });
    });
});

// 6. List all batches, newest first, with a review count for each
app.get("/api/batches", (req, res) => {
  db.all(
    `SELECT b.id, b.label, b.type, b.created_at, COUNT(r.id) as review_count
     FROM batches b
     LEFT JOIN reviews r ON r.batch_id = b.id
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 5. Settings - get and update the alert threshold
app.get("/api/settings", async (req, res) => {
  const threshold = await getAlertThreshold();
  res.json({ alertThreshold: threshold });
});

app.post("/api/settings", (req, res) => {
  const { alertThreshold } = req.body;

  if (typeof alertThreshold !== "number" || alertThreshold < -1 || alertThreshold > 0) {
    return res.status(400).json({ error: "alertThreshold must be a number between -1 and 0" });
  }

  db.run(
    `INSERT INTO settings (key, value) VALUES ('alert_threshold', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [String(alertThreshold)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ alertThreshold });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Node server running on http://localhost:${PORT}`);
});