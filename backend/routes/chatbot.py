"""
Chatbot Router – Google Gemini API integration.
POST /api/chat  → accepts user message + optional prediction context
"""

import os
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models_dir.db_models import Prediction
from models_dir.schemas import ChatRequest, ChatResponse

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
)


def build_system_context(prediction: Prediction | None) -> str:
    """Build a system prompt enriched with the latest prediction context."""
    base = (
        "You are LogiPredict AI Assistant – an expert in logistics and supply chain management. "
        "You help users understand delivery delay predictions, explain risk factors, "
        "and provide actionable suggestions to improve on-time delivery performance. "
        "Always be concise, professional, and data-driven. "
        "If you don't know something, say so honestly."
    )

    if prediction:
        base += f"""

LATEST PREDICTION CONTEXT:
- Shipping Mode: {prediction.shipping_mode}
- Distance: {prediction.distance_km} km
- Weather: {prediction.weather_condition}
- Traffic: {prediction.traffic_level}
- Order Priority: {prediction.order_priority}
- Route: {prediction.warehouse_location} → {prediction.delivery_location}
- Predicted Delay: {'YES' if prediction.predicted_delay else 'NO'}
- Risk Score: {prediction.probability_score:.1%}
- Identified Reasons: {prediction.reason_for_delay}
- Mitigation Suggestions: {prediction.mitigation_suggestions}

Answer all questions in the context of this specific shipment.
"""
    return base


def fallback_response(message: str, prediction: Prediction | None) -> str:
    """Rule-based fallback when Gemini API key is not configured."""
    msg = message.lower()

    if not prediction:
        return (
            "I don't have a specific prediction to reference yet. "
            "Please run a prediction first, then I can answer detailed questions about it!"
        )

    status = "delayed" if prediction.predicted_delay else "on time"
    risk   = f"{prediction.probability_score:.0%}"

    if any(w in msg for w in ["why", "reason", "cause", "factor"]):
        return (
            f"Your shipment from {prediction.warehouse_location} to {prediction.delivery_location} "
            f"is predicted to be **{status}** with a {risk} risk score. "
            f"Key reasons: {prediction.reason_for_delay}"
        )

    if any(w in msg for w in ["improve", "reduce", "fix", "suggest", "how"]):
        return (
            f"To reduce the delay risk for this shipment, here are the recommendations: "
            f"{prediction.mitigation_suggestions}"
        )

    if any(w in msg for w in ["risk", "score", "probability", "percent"]):
        return (
            f"The delay risk score is **{risk}**. "
            f"This falls in the {'High' if prediction.probability_score > 0.6 else 'Medium' if prediction.probability_score > 0.35 else 'Low'} "
            f"risk category."
        )

    return (
        f"Your shipment ({prediction.warehouse_location} → {prediction.delivery_location}) "
        f"has a **{risk}** delay probability and is predicted to be **{status}**. "
        f"Ask me about the reasons, risk score, or how to improve delivery performance!"
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Chat endpoint – uses Gemini API if key is set, else returns rule-based response.
    Optionally enriches context with a specific prediction record.
    """
    # Fetch prediction context if provided
    prediction = None
    if payload.prediction_id:
        prediction = db.query(Prediction).filter(Prediction.id == payload.prediction_id).first()

    # If no specific ID, use the latest prediction as context
    if not prediction:
        prediction = (
            db.query(Prediction).order_by(Prediction.id.desc()).first()
        )

    # ── Try Gemini API ─────────────────────────────────────────────────────────
    if GEMINI_API_KEY:
        system_ctx = build_system_context(prediction)
        body = {
            "system_instruction": {"parts": [{"text": system_ctx}]},
            "contents": [{"parts": [{"text": payload.message}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 512,
            },
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                    json=body,
                )
                resp.raise_for_status()
                data = resp.json()
                reply = (
                    data["candidates"][0]["content"]["parts"][0]["text"]
                )
                return ChatResponse(reply=reply, source="gemini")
        except Exception as e:
            # Fall through to rule-based on API error
            print(f"Gemini API error: {e}")

    # ── Fallback rule-based response ───────────────────────────────────────────
    reply = fallback_response(payload.message, prediction)
    return ChatResponse(reply=reply, source="fallback")
