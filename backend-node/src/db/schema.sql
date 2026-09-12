CREATE DATABASE IF NOT EXISTS pulse_db;
USE pulse_db;

CREATE TABLE IF NOT EXISTS batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_text TEXT NOT NULL,
    sentiment VARCHAR(50) NOT NULL,
    confidence FLOAT,
    severity FLOAT DEFAULT 0,
    aspect VARCHAR(100),
    alert_sent BOOLEAN DEFAULT FALSE,
    batch_id INT,
    status VARCHAR(50) DEFAULT 'New',
    priority_score FLOAT DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255)
);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('alert_threshold', '-0.5');
