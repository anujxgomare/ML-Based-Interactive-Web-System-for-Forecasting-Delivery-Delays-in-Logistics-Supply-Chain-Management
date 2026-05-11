"""
SQLAlchemy ORM Models – defines all database tables.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base


class Prediction(Base):
    """Stores every delivery delay prediction with inputs, outputs, and explanations."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # ── Input Features ─────────────────────────────────────────────────────────
    shipping_mode       = Column(String(50),  nullable=False)
    distance_km         = Column(Float,       nullable=False)
    weather_condition   = Column(String(50),  nullable=False)
    traffic_level       = Column(String(50),  nullable=False)
    order_priority      = Column(String(50),  nullable=False)
    warehouse_location  = Column(String(100), nullable=False)
    delivery_location   = Column(String(100), nullable=False)

    # ── Prediction Outputs ─────────────────────────────────────────────────────
    predicted_delay     = Column(Boolean,  nullable=False)       # True = delayed
    probability_score   = Column(Float,    nullable=False)       # 0.0 – 1.0

    # ── Explainability ─────────────────────────────────────────────────────────
    reason_for_delay        = Column(Text, nullable=True)
    mitigation_suggestions  = Column(Text, nullable=True)

    # ── Metadata ───────────────────────────────────────────────────────────────
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    """Basic user table for authentication."""
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username     = Column(String(80),  unique=True, index=True, nullable=False)
    email        = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
