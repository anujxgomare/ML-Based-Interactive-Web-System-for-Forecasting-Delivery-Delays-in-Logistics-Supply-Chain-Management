"""
seed_admin.py  –  run once to create the admin user
Usage:  python seed_admin.py

Works with both SQLite (default) and MySQL.
"""

import sys, os, hashlib
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base, SessionLocal
from models_dir.db_models import User

# ── Recreate all tables if missing ───────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Same hash function used in auth.py (plain SHA-256, no salt) ──────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

db = SessionLocal()

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
ADMIN_EMAIL    = "admin@logipredict.ai"

existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()

if existing:
    existing.hashed_password = hash_password(ADMIN_PASSWORD)
    db.commit()
    print(f"✅ Admin password reset to '{ADMIN_PASSWORD}'")
else:
    admin = User(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
    )
    db.add(admin)
    db.commit()
    print(f"✅ Admin user created  →  username: {ADMIN_USERNAME}  password: {ADMIN_PASSWORD}")

db.close()
print("Done. You can now log in.")