"""
ML Prediction Engine + Explainability Layer
Handles feature encoding, model inference, and rule-based explanations.
"""

import numpy as np
from typing import Tuple, Optional


# ── Feature Encoding Maps ──────────────────────────────────────────────────────
SHIPPING_MODE_MAP = {
    "Standard": 0, "Express": 1, "Same-Day": 2, "Overnight": 3
}
WEATHER_MAP = {
    "Clear": 0, "Foggy": 1, "Rainy": 2, "Snowy": 3, "Stormy": 4
}
TRAFFIC_MAP = {
    "Low": 0, "Medium": 1, "High": 2, "Severe": 3
}
PRIORITY_MAP = {
    "Low": 0, "Medium": 1, "High": 2, "Critical": 3
}

# Risk level thresholds
RISK_THRESHOLDS = {
    "Low":      (0.0,  0.35),
    "Medium":   (0.35, 0.60),
    "High":     (0.60, 0.80),
    "Critical": (0.80, 1.01),
}


def encode_features(
    shipping_mode: str,
    distance_km: float,
    weather_condition: str,
    traffic_level: str,
    order_priority: str,
    warehouse_location: str,
    delivery_location: str,
) -> np.ndarray:
    """
    Encode categorical + numerical inputs into a feature vector
    compatible with the trained XGBoost model.
    """
    # Simple location hash (consistent across runs)
    wh_hash  = abs(hash(warehouse_location)) % 100 / 100.0
    del_hash = abs(hash(delivery_location))  % 100 / 100.0

    features = np.array([[
        SHIPPING_MODE_MAP.get(shipping_mode, 0),
        distance_km,
        WEATHER_MAP.get(weather_condition, 0),
        TRAFFIC_MAP.get(traffic_level, 0),
        PRIORITY_MAP.get(order_priority, 0),
        wh_hash,
        del_hash,
    ]])
    return features


def rule_based_predict(
    shipping_mode: str,
    distance_km: float,
    weather_condition: str,
    traffic_level: str,
    order_priority: str,
) -> float:
    """
    Fallback rule-based probability score when model.pkl is absent.
    Returns a float 0.0–1.0 representing delay probability.
    """
    score = 0.0

    # Distance factor
    if distance_km > 1000: score += 0.30
    elif distance_km > 500: score += 0.15
    elif distance_km > 200: score += 0.08

    # Weather factor
    weather_scores = {"Clear": 0.0, "Foggy": 0.10, "Rainy": 0.20, "Snowy": 0.25, "Stormy": 0.35}
    score += weather_scores.get(weather_condition, 0)

    # Traffic factor
    traffic_scores = {"Low": 0.0, "Medium": 0.10, "High": 0.20, "Severe": 0.30}
    score += traffic_scores.get(traffic_level, 0)

    # Shipping mode factor (slower = more risk)
    mode_scores = {"Same-Day": 0.0, "Overnight": 0.05, "Express": 0.05, "Standard": 0.15}
    score += mode_scores.get(shipping_mode, 0)

    return min(score, 0.98)  # cap at 98%


def run_prediction(
    model,
    shipping_mode: str,
    distance_km: float,
    weather_condition: str,
    traffic_level: str,
    order_priority: str,
    warehouse_location: str,
    delivery_location: str,
) -> Tuple[bool, float]:
    """
    Run the XGBoost model (or fallback) and return (delayed: bool, probability: float).
    """
    if model is not None:
        features = encode_features(
            shipping_mode, distance_km, weather_condition,
            traffic_level, order_priority, warehouse_location, delivery_location,
        )
        try:
            prob = float(model.predict_proba(features)[0][1])
        except Exception:
            # If model has different feature count, use rule-based
            prob = rule_based_predict(shipping_mode, distance_km, weather_condition, traffic_level, order_priority)
    else:
        prob = rule_based_predict(shipping_mode, distance_km, weather_condition, traffic_level, order_priority)

    delayed = prob >= 0.5
    return delayed, round(prob, 4)


def get_risk_level(probability: float) -> str:
    """Map probability to human-readable risk level."""
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= probability < hi:
            return level
    return "Critical"


def generate_explanation(
    shipping_mode: str,
    distance_km: float,
    weather_condition: str,
    traffic_level: str,
    order_priority: str,
    warehouse_location: str,
    delivery_location: str,
    delayed: bool,
    probability: float,
) -> Tuple[str, str]:
    """
    Rule-based explainability layer.
    Returns (reason_for_delay, mitigation_suggestions) as formatted strings.
    """
    reasons     = []
    suggestions = []

    # ── Weather ───────────────────────────────────────────────────────────────
    if weather_condition in ("Stormy", "Snowy"):
        reasons.append(f"Severe {weather_condition.lower()} weather significantly disrupts transport networks.")
        suggestions.append("Monitor weather forecasts and pre-position inventory closer to the destination.")
    elif weather_condition == "Rainy":
        reasons.append("Rainy weather causes road slowdowns and increases accident risk.")
        suggestions.append("Consider shifting to express/overnight shipping during rainy periods.")

    # ── Traffic ───────────────────────────────────────────────────────────────
    if traffic_level == "Severe":
        reasons.append("Severe traffic congestion is a primary delay driver on this route.")
        suggestions.append("Reroute via alternative highways or schedule dispatch during off-peak hours (early morning or late night).")
    elif traffic_level == "High":
        reasons.append("High traffic levels are adding significant transit time.")
        suggestions.append("Adjust dispatch timing to avoid peak traffic windows (7–9 AM, 5–7 PM).")

    # ── Distance ─────────────────────────────────────────────────────────────
    if distance_km > 1000:
        reasons.append(f"The long delivery distance of {distance_km:.0f} km increases exposure to delays at multiple transit points.")
        suggestions.append("Use a nearer regional warehouse or establish a hub closer to the delivery zone.")
    elif distance_km > 500:
        reasons.append(f"Moderate-to-long distance ({distance_km:.0f} km) adds transit risk.")
        suggestions.append("Consider upgrading to Express or Overnight shipping to compensate for distance.")

    # ── Shipping Mode ─────────────────────────────────────────────────────────
    if shipping_mode == "Standard" and delayed:
        reasons.append("Standard shipping mode has the least priority in logistics queues.")
        suggestions.append("Upgrade to Express or Overnight shipping for time-sensitive orders.")

    # ── Order Priority vs Shipping Mode mismatch ──────────────────────────────
    if order_priority in ("High", "Critical") and shipping_mode == "Standard":
        reasons.append(f"Mismatch detected: {order_priority} priority order shipped via Standard mode.")
        suggestions.append(f"Always use Same-Day or Overnight shipping for {order_priority} priority orders.")

    # ── Warehouse location ─────────────────────────────────────────────────────
    if warehouse_location.lower() != delivery_location.lower():
        reasons.append(f"Shipment originates from {warehouse_location}, requiring inter-city transit to {delivery_location}.")
        suggestions.append(f"Use a warehouse in or near {delivery_location} to eliminate long-haul transit.")

    # ── Defaults if no specific reason found ─────────────────────────────────
    if not reasons:
        if delayed:
            reasons.append("Combination of operational factors is creating a moderate delay risk.")
        else:
            reasons.append("No major delay risk factors detected for this shipment.")

    if not suggestions:
        suggestions.append("Maintain current shipping parameters; consider periodic route optimization reviews.")

    reason_text      = " | ".join(reasons)
    suggestion_text  = " | ".join(suggestions)
    return reason_text, suggestion_text
