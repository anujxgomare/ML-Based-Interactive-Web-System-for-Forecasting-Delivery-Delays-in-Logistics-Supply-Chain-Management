"""
generate_model.py
Run this ONCE to create a demo model.pkl for development/testing.
In production, replace model.pkl with your actual trained XGBoost model.

Usage:
    python generate_model.py
"""

import pickle
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

try:
    from xgboost import XGBClassifier
    print("Using XGBoost...")
    clf = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier
    print("XGBoost not found, using GradientBoosting fallback...")
    clf = GradientBoostingClassifier(n_estimators=100, random_state=42)

# ── Generate synthetic training data (7 features) ─────────────────────────────
np.random.seed(42)
N = 2000
X = np.column_stack([
    np.random.randint(0, 4, N),           # shipping_mode  (0-3)
    np.random.uniform(10, 2000, N),        # distance_km
    np.random.randint(0, 5, N),            # weather (0-4)
    np.random.randint(0, 4, N),            # traffic (0-3)
    np.random.randint(0, 4, N),            # priority (0-3)
    np.random.uniform(0, 1, N),            # warehouse hash
    np.random.uniform(0, 1, N),            # delivery hash
])

# Label: delayed if any high-risk combo
y = (
    (X[:, 1] > 800) |
    (X[:, 2] >= 3) |
    (X[:, 3] >= 2) |
    ((X[:, 0] == 0) & (X[:, 1] > 400))
).astype(int)

# Add some noise
noise = np.random.random(N) < 0.1
y = np.where(noise, 1 - y, y)

clf.fit(X, y)
print(f"Training accuracy: {(clf.predict(X) == y).mean():.2%}")

with open("model.pkl", "wb") as f:
    pickle.dump(clf, f)

print("✅ model.pkl saved successfully!")
print(f"   Feature count: 7")
print(f"   Samples trained on: {N}")
