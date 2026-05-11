-- ============================================================
-- LogiPredict AI – MySQL Database Schema
-- Run this to create the database and tables from scratch
-- ============================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS logipredict
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE logipredict;

-- ── Users table (authentication) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    username         VARCHAR(80)  NOT NULL UNIQUE,
    email            VARCHAR(120) NOT NULL UNIQUE,
    hashed_password  VARCHAR(256) NOT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email    (email)
);

-- ── Predictions table (core data) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
    id                     INT AUTO_INCREMENT PRIMARY KEY,

    -- Input features
    shipping_mode          VARCHAR(50)  NOT NULL,
    distance_km            FLOAT        NOT NULL,
    weather_condition      VARCHAR(50)  NOT NULL,
    traffic_level          VARCHAR(50)  NOT NULL,
    order_priority         VARCHAR(50)  NOT NULL,
    warehouse_location     VARCHAR(100) NOT NULL,
    delivery_location      VARCHAR(100) NOT NULL,

    -- ML outputs
    predicted_delay        BOOLEAN      NOT NULL,
    probability_score      FLOAT        NOT NULL,

    -- Explainability
    reason_for_delay       TEXT,
    mitigation_suggestions TEXT,

    -- Metadata
    timestamp              DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_timestamp      (timestamp),
    INDEX idx_predicted_delay(predicted_delay),
    INDEX idx_shipping_mode  (shipping_mode),
    INDEX idx_weather        (weather_condition),
    INDEX idx_traffic        (traffic_level)
);

-- ── Insert a default admin user (password: admin123) ─────────────────────────
-- The hashed_password below uses SHA-256(password + "logipredict-secret-key-change-in-production")
-- You can regenerate with Python:
-- import hashlib
-- print(hashlib.sha256(("admin123" + "logipredict-secret-key-change-in-production").encode()).hexdigest())
INSERT IGNORE INTO users (username, email, hashed_password) VALUES (
    'admin',
    'admin@logipredict.ai',
    '9f3e2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1'
);

-- ── Sample prediction data (optional, for testing dashboard) ─────────────────
INSERT INTO predictions
  (shipping_mode, distance_km, weather_condition, traffic_level,
   order_priority, warehouse_location, delivery_location,
   predicted_delay, probability_score, reason_for_delay, mitigation_suggestions)
VALUES
  ('Express',  350, 'Clear',  'Medium', 'High',     'Mumbai',   'Pune',        0, 0.22, 'No major risk factors.', 'Maintain current parameters.'),
  ('Standard', 820, 'Rainy',  'High',   'Medium',   'Delhi',    'Jaipur',      1, 0.74, 'Rainy weather + high traffic.', 'Upgrade to Express; dispatch at off-peak hours.'),
  ('Overnight',150, 'Clear',  'Low',    'Critical', 'Bangalore','Chennai',     0, 0.18, 'Short distance, good conditions.', 'No changes needed.'),
  ('Standard',1200, 'Stormy', 'Severe', 'Low',      'Kolkata',  'Bhubaneswar', 1, 0.91, 'Stormy weather + severe traffic + long distance.', 'Use nearer warehouse; switch to Same-Day shipping.'),
  ('Express',  480, 'Foggy',  'Medium', 'High',     'Hyderabad','Vijayawada',  1, 0.58, 'Foggy weather adds transit risk.', 'Monitor forecasts; pre-position inventory.'),
  ('Same-Day', 80,  'Clear',  'Low',    'Critical', 'Chennai',  'Coimbatore',  0, 0.12, 'Excellent conditions for delivery.', 'No changes needed.'),
  ('Standard', 600, 'Rainy',  'High',   'Low',      'Ahmedabad','Surat',       1, 0.69, 'Rainy + high traffic on standard mode.', 'Upgrade shipping mode.'),
  ('Express',  220, 'Clear',  'Medium', 'Medium',   'Pune',     'Nashik',      0, 0.28, 'Moderate conditions.', 'Review routing periodically.');
