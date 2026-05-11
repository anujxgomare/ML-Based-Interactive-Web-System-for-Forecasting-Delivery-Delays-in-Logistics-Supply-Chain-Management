"""
Pydantic schemas – request/response validation for all API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums for constrained input fields ────────────────────────────────────────
class ShippingMode(str, Enum):
    standard    = "Standard"
    express     = "Express"
    same_day    = "Same-Day"
    overnight   = "Overnight"

class WeatherCondition(str, Enum):
    clear   = "Clear"
    rainy   = "Rainy"
    stormy  = "Stormy"
    foggy   = "Foggy"
    snowy   = "Snowy"

class TrafficLevel(str, Enum):
    low     = "Low"
    medium  = "Medium"
    high    = "High"
    severe  = "Severe"

class OrderPriority(str, Enum):
    low      = "Low"
    medium   = "Medium"
    high     = "High"
    critical = "Critical"


# ── Prediction Request ─────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    shipping_mode:      ShippingMode      = Field(..., example="Express")
    distance_km:        float             = Field(..., ge=1, le=5000, example=350.0)
    weather_condition:  WeatherCondition  = Field(..., example="Rainy")
    traffic_level:      TrafficLevel      = Field(..., example="High")
    order_priority:     OrderPriority     = Field(..., example="High")
    warehouse_location: str               = Field(..., min_length=2, example="Mumbai")
    delivery_location:  str               = Field(..., min_length=2, example="Pune")


# ── Prediction Response ────────────────────────────────────────────────────────
class PredictionResponse(BaseModel):
    id:                     int
    predicted_delay:        bool
    probability_score:      float
    risk_level:             str          # Low / Medium / High / Critical
    reason_for_delay:       str
    mitigation_suggestions: str
    timestamp:              datetime

    class Config:
        from_attributes = True


# ── History list item ─────────────────────────────────────────────────────────
class PredictionRecord(BaseModel):
    id:                     int
    shipping_mode:          str
    distance_km:            float
    weather_condition:      str
    traffic_level:          str
    order_priority:         str
    warehouse_location:     str
    delivery_location:      str
    predicted_delay:        bool
    probability_score:      float
    reason_for_delay:       Optional[str]
    mitigation_suggestions: Optional[str]
    timestamp:              datetime

    class Config:
        from_attributes = True


# ── Chat ──────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message:        str = Field(..., min_length=1, example="Why was my delivery delayed?")
    prediction_id:  Optional[int] = Field(None, example=42)

class ChatResponse(BaseModel):
    reply:  str
    source: str  # "gemini" | "fallback"


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    email:    str
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    username:     str


# ── Stats for dashboard ───────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_predictions:  int
    total_delayed:      int
    delay_percentage:   float
    avg_risk_score:     float
    recent_predictions: List[PredictionRecord]
