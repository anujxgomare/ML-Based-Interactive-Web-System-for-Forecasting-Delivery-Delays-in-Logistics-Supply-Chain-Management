"""
LogiPredict AI – Delivery Delay Forecasting System
Main FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pickle
import os

from database import engine, Base
from routes import predictions, chatbot, auth

# ── Lifespan: load model once at startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the XGBoost model at startup and store in app state."""
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    if os.path.exists(model_path):
        with open(model_path, "rb") as f:
            app.state.model = pickle.load(f)
        print("✅ ML model loaded from model.pkl")
    else:
        # Fallback: create a dummy model for demo purposes
        app.state.model = None
        print("⚠️  model.pkl not found – using rule-based fallback predictions")

    # Create all DB tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ready")

    yield  # App runs here

    print("🔄 Shutting down LogiPredict AI...")


# ── App Initialization ─────────────────────────────────────────────────────────
app = FastAPI(
    title="LogiPredict AI",
    description="Delivery Delay Forecasting System powered by XGBoost + Gemini AI",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware (allow React frontend) ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ───────────────────────────────────────────────────────────
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "LogiPredict AI is running 🚀", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"healthy": True}
