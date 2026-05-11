"""
Auth Router – JWT authentication.
FIXED:
  - Signup no longer requires email (made optional)
  - Password hashing is consistent (plain SHA-256, no salt)
  - Better error messages returned as plain strings
"""

import os
import hashlib
import hmac
import base64
import json
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models_dir.db_models import User

router = APIRouter(prefix="/auth")
bearer = HTTPBearer(auto_error=False)
SECRET = os.getenv("JWT_SECRET", "logipredict-secret-key-change-in-production")


# ── Pydantic schemas defined here to avoid any import issues ──────────────────
class UserCreate(BaseModel):
    username: str
    password: str
    email:    Optional[str] = None   # optional – no longer required


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    username:     str


# ── Password hashing (plain SHA-256, no extra salt) ───────────────────────────
def hash_password(password: str) -> str:
    """SHA-256 hash – consistent everywhere in the app."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# ── Minimal JWT (HS256) without external libraries ───────────────────────────
def _b64enc(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64dec(s: str) -> bytes:
    padding = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * padding)

def create_token(user_id: int, username: str) -> str:
    header  = _b64enc(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64enc(json.dumps({
        "sub":      user_id,
        "username": username,
        "exp":      int(time.time()) + 86400 * 7,   # 7 days
    }).encode())
    sig = _b64enc(
        hmac.new(SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{payload}.{sig}"

def decode_token(token: str) -> dict:
    try:
        header, payload, sig = token.split(".")
        expected = _b64enc(
            hmac.new(SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(sig, expected):
            raise ValueError("bad sig")
        data = json.loads(_b64dec(payload))
        if data["exp"] < time.time():
            raise ValueError("expired")
        return data
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── POST /api/auth/signup ─────────────────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    # Validate manually so we return clean string errors
    if not payload.username or len(payload.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # email is optional; use a placeholder if not provided
    email = payload.email or f"{payload.username}@logipredict.local"

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username,
        email=email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_token(user.id, user.username),
        username=user.username,
    )


# ── POST /api/auth/login ──────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    if not payload.username or not payload.password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    user = db.query(User).filter(User.username == payload.username).first()

    if not user or user.hashed_password != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return TokenResponse(
        access_token=create_token(user.id, user.username),
        username=user.username,
    )


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@router.get("/me")
def me(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    data = decode_token(credentials.credentials)
    return {"user_id": data["sub"], "username": data["username"]}