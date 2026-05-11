"""
Predictions Router
POST /api/predict     → run ML prediction and store result
GET  /api/predictions → fetch prediction history
GET  /api/predictions/{id} → fetch single prediction
GET  /api/stats       → dashboard statistics
GET  /api/export      → export as CSV
"""

import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models_dir.db_models import Prediction
from models_dir.schemas import (
    PredictionRequest, PredictionResponse, PredictionRecord, DashboardStats
)
from models_dir.ml_engine import run_prediction, generate_explanation, get_risk_level

router = APIRouter()


# ── POST /predict ──────────────────────────────────────────────────────────────
@router.post("/predict", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Accept delivery parameters, run XGBoost prediction,
    generate explanation, store result in DB, and return response.
    """
    model = getattr(request.app.state, "model", None)

    # 1. Run ML prediction
    delayed, probability = run_prediction(
        model=model,
        shipping_mode=payload.shipping_mode,
        distance_km=payload.distance_km,
        weather_condition=payload.weather_condition,
        traffic_level=payload.traffic_level,
        order_priority=payload.order_priority,
        warehouse_location=payload.warehouse_location,
        delivery_location=payload.delivery_location,
    )

    # 2. Generate rule-based explanation
    reason, suggestions = generate_explanation(
        shipping_mode=payload.shipping_mode,
        distance_km=payload.distance_km,
        weather_condition=payload.weather_condition,
        traffic_level=payload.traffic_level,
        order_priority=payload.order_priority,
        warehouse_location=payload.warehouse_location,
        delivery_location=payload.delivery_location,
        delayed=delayed,
        probability=probability,
    )

    # 3. Persist to DB
    record = Prediction(
        shipping_mode=payload.shipping_mode,
        distance_km=payload.distance_km,
        weather_condition=payload.weather_condition,
        traffic_level=payload.traffic_level,
        order_priority=payload.order_priority,
        warehouse_location=payload.warehouse_location,
        delivery_location=payload.delivery_location,
        predicted_delay=delayed,
        probability_score=probability,
        reason_for_delay=reason,
        mitigation_suggestions=suggestions,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # 4. Return structured response
    return PredictionResponse(
        id=record.id,
        predicted_delay=delayed,
        probability_score=probability,
        risk_level=get_risk_level(probability),
        reason_for_delay=reason,
        mitigation_suggestions=suggestions,
        timestamp=record.timestamp,
    )


# ── GET /predictions ───────────────────────────────────────────────────────────
@router.get("/predictions", response_model=List[PredictionRecord])
def get_predictions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Fetch paginated prediction history, newest first."""
    records = (
        db.query(Prediction)
        .order_by(Prediction.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


# ── GET /predictions/{id} ──────────────────────────────────────────────────────
@router.get("/predictions/{prediction_id}", response_model=PredictionRecord)
def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Fetch a single prediction by ID."""
    record = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return record


# ── GET /stats ─────────────────────────────────────────────────────────────────
@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for the dashboard."""
    total   = db.query(func.count(Prediction.id)).scalar() or 0
    delayed = db.query(func.count(Prediction.id)).filter(Prediction.predicted_delay == True).scalar() or 0
    avg_risk = db.query(func.avg(Prediction.probability_score)).scalar() or 0.0

    recent = (
        db.query(Prediction)
        .order_by(Prediction.timestamp.desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_predictions=total,
        total_delayed=delayed,
        delay_percentage=round((delayed / total * 100) if total > 0 else 0.0, 1),
        avg_risk_score=round(float(avg_risk), 4),
        recent_predictions=recent,
    )


# ── GET /export ────────────────────────────────────────────────────────────────
@router.get("/export")
def export_csv(db: Session = Depends(get_db)):
    """Export all predictions as a downloadable CSV file."""
    records = db.query(Prediction).order_by(Prediction.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Shipping Mode", "Distance (km)", "Weather", "Traffic",
        "Priority", "Warehouse", "Delivery Location",
        "Delayed", "Probability", "Reason", "Suggestions", "Timestamp"
    ])
    for r in records:
        writer.writerow([
            r.id, r.shipping_mode, r.distance_km, r.weather_condition,
            r.traffic_level, r.order_priority, r.warehouse_location,
            r.delivery_location, "Yes" if r.predicted_delay else "No",
            f"{r.probability_score:.2%}", r.reason_for_delay,
            r.mitigation_suggestions, r.timestamp,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=logipredict_export.csv"},
    )
