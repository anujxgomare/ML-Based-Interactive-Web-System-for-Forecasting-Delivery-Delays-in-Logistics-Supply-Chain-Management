# 🚚 ML-Based Interactive Web System for Forecasting Delivery Delays in Logistics & Supply Chain Management

> A production-ready full-stack ML application for predicting and analyzing delivery delays.
> Built with FastAPI · React · MySQL · XGBoost · Google Gemini AI

---
Screenshots :-
login Page
<img width="1600" height="766" alt="login page" src="https://github.com/user-attachments/assets/38f2f173-22da-4a49-a855-c75886398180" />
Prediction
<img width="1600" height="761" alt="prediction" src="https://github.com/user-attachments/assets/764e8914-7a8b-4324-921e-265e11c86ab0" />
Dashboard
<img width="1600" height="765" alt="dashboard" src="https://github.com/user-attachments/assets/fd132bbd-0dc3-41c0-935d-cd3d15821a36" />
Analytical Dashboard
<img width="1600" height="782" alt="dashboard1" src="https://github.com/user-attachments/assets/a27c4a7b-cf19-44a9-96f9-d870d240d587" />
Ai chatbot
<img width="1600" height="761" alt="ai chatbot" src="https://github.com/user-attachments/assets/5ad8c794-d9c0-4531-97ab-c7d362aeac9f" />

---

## 📐 Architecture Overview

```
logipredict/
├── backend/
│   ├── main.py               ← FastAPI app entry point
│   ├── database.py           ← SQLAlchemy DB config (MySQL / SQLite)
│   ├── generate_model.py     ← Script to create demo model.pkl
│   ├── model.pkl             ← Your trained XGBoost model (place here)
│   ├── requirements.txt
│   ├── .env.example
│   ├── models_dir/
│   │   ├── db_models.py      ← SQLAlchemy ORM tables
│   │   ├── schemas.py        ← Pydantic request/response models
│   │   └── ml_engine.py      ← ML inference + explainability logic
│   └── routes/
│       ├── predictions.py    ← POST /predict, GET /predictions, GET /stats
│       ├── chatbot.py        ← POST /chat (Gemini API)
│       └── auth.py           ← POST /auth/signup, /auth/login
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.js            ← Router + auth state
│       ├── App.css           ← Global dark theme design system
│       ├── pages/
│       │   ├── LoginPage.js      ← Sign In / Sign Up
│       │   ├── PredictionPage.js ← Main prediction form + result
│       │   └── DashboardPage.js  ← Analytics + charts + history table
│       ├── components/
│       │   ├── Navbar.js         ← Top navigation
│       │   ├── ResultCard.js     ← Prediction result display
│       │   └── Chatbot.js        ← Floating AI chatbot
│       └── services/
│           └── api.js            ← Axios API layer
│
└── schema.sql                ← MySQL database schema + seed data
```

---

## ⚡ Quick Start (5 Steps)

### Step 1 – Clone / Download the project

```bash
# If using git
git clone https://github.com/anujxgomare/ML-Based-Interactive-Web-System-for-Forecasting-Delivery-Delays-in-Logistics-Supply-Chain-Management.git
cd logipredict-ai
```

---

### Step 2 – Set up the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and Gemini API key
```

---

### Step 3 – Set up the Database

**Option A – MySQL (recommended)**
```sql
-- In MySQL client:
mysql -u root -p
source schema.sql;
-- This creates the 'logipredict' database, tables, and seed data
```

**Option B – SQLite (zero-config, no MySQL needed)**
```bash
# In .env, set:
USE_SQLITE=true
# SQLite file will be created automatically at backend/logipredict.db
```

---

### Step 4 – Generate or place the ML model

**If you have your own trained XGBoost model:**
```bash
# Simply copy your model file to:
cp /path/to/your/model.pkl backend/model.pkl
# The model must accept a (N, 7) feature array:
# [shipping_mode_encoded, distance_km, weather_encoded,
#  traffic_encoded, priority_encoded, warehouse_hash, delivery_hash]
```

**If you need a demo model for testing:**
```bash
cd backend
python generate_model.py
# Creates a demo model.pkl trained on synthetic data
```

---

### Step 5 – Start the servers

**Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## 🌐 Application Pages

| URL | Description |
|-----|-------------|
| `http://localhost:3000/login` | Sign In / Sign Up |
| `http://localhost:3000/predict` | Prediction form + AI chatbot |
| `http://localhost:3000/dashboard` | Analytics dashboard |

**Default login:** username `admin` / password `admin123`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Run ML prediction |
| `GET` | `/api/predictions` | Fetch prediction history |
| `GET` | `/api/predictions/{id}` | Fetch single prediction |
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/export` | Download CSV export |
| `POST` | `/api/chat` | AI chatbot message |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login and get JWT |
| `GET` | `/api/auth/me` | Verify JWT token |

**Interactive API docs:** `http://localhost:8000/docs`

---

## 🤖 Gemini AI Chatbot Setup

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** (free tier, no credit card)
3. Copy the key into your `.env`:
   ```
   GEMINI_API_KEY=AIzaSy...your-key-here
   ```
4. Restart the backend

Without a key, the chatbot uses a built-in rule-based fallback that still answers questions about delay reasons and suggestions.

---

## 🧠 ML Model Integration

The system expects a scikit-learn-compatible model (XGBoost, sklearn, etc.) that:
- Has a `predict_proba(X)` method
- Accepts feature arrays with this column order:

| Index | Feature | Encoding |
|-------|---------|----------|
| 0 | shipping_mode | Standard=0, Express=1, Same-Day=2, Overnight=3 |
| 1 | distance_km | Raw float |
| 2 | weather_condition | Clear=0, Foggy=1, Rainy=2, Snowy=3, Stormy=4 |
| 3 | traffic_level | Low=0, Medium=1, High=2, Severe=3 |
| 4 | order_priority | Low=0, Medium=1, High=2, Critical=3 |
| 5 | warehouse_hash | hash(location) % 100 / 100.0 |
| 6 | delivery_hash | hash(location) % 100 / 100.0 |

---

## 📊 Dashboard Features

- **4 KPI Cards** – Total predictions, delayed count, on-time count, avg risk score
- **Pie Chart** – Delay vs On-Time distribution
- **Line Chart** – Risk score trend across last 20 predictions
- **Bar Charts** – Delays by shipping mode and weather condition
- **Data Table** – Recent 10 predictions with full details
- **CSV Export** – One-click download of full history

---

## 🔒 Authentication

- JWT-based stateless auth (7-day token expiry)
- Passwords hashed with SHA-256 + secret salt
- Tokens stored in `localStorage`
- All API endpoints protected via Bearer token

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, Axios |
| Backend | FastAPI, Uvicorn, SQLAlchemy |
| Database | MySQL 8 (SQLite fallback) |
| ML Model | XGBoost / scikit-learn (.pkl) |
| AI Chatbot | Google Gemini 1.5 Flash API |
| Fonts | Syne (display), IBM Plex Mono, Inter |

---

## 🐛 Troubleshooting

**Backend won't start:**
```bash
# Check Python version (3.10+ required)
python --version

# Install missing packages
pip install -r requirements.txt
```

**MySQL connection error:**
```bash
# Use SQLite fallback
USE_SQLITE=true  # in .env
```

**CORS error in browser:**
- Ensure backend is running on port 8000
- Check the `allow_origins` list in `main.py`

**Chatbot not responding:**
- Verify `GEMINI_API_KEY` in `.env`
- Check backend logs for API errors
- The rule-based fallback will activate automatically

**Model prediction seems off:**
- Run `python generate_model.py` to create a fresh demo model
- Ensure your custom `model.pkl` accepts 7 features

---

## 📄 License

MIT – Free to use for educational and personal projects.

---

*Built for final-year project demonstration and portfolio showcase.*
