from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime

import models
from models import User, QRCode, Tree
from database import engine, SessionLocal, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class UserAuth(BaseModel):
    username: str
    password: str

class QRVerifyRequest(BaseModel):
    qr_data: str
    user_id: int
    lat: Optional[float] = 0.0
    lon: Optional[float] = 0.0

@app.post("/register")
def register(user_data: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pw, score=0)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "score": 0}

@app.post("/login")
def login(user_data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    return {"id": user.id, "username": user.username, "score": user.score}

@app.post("/verify-qr")
def verify_qr(request: QRVerifyRequest, db: Session = Depends(get_db)):
    qr_entry = db.query(QRCode).filter(QRCode.id == request.qr_data).first()
    if not qr_entry:
        raise HTTPException(status_code=400, detail="QR Code Invalid")

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_tree = Tree(
        lat=request.lat,
        lon=request.lon,
        owner_id=user.id,
        qr_code_id=qr_entry.id,
        created_at=datetime.utcnow(),
        last_watered_date=datetime.utcnow()
    )
    db.add(new_tree)
    user.score += 1
    db.commit()
    db.refresh(user)
    return {"status": "success", "new_score": user.score, "message": f"Planted {qr_entry.tree_type}!"}

# --- ОБНОВЛЕННЫЙ SEED ЭНДПОИНТ ---
@app.post("/seed-qr")
def seed_qr(db: Session = Depends(get_db)):
    # Тот же список, что и в generate_qrs.py
    tree_data = [
        {"id": "ELM-001", "type": "Elm (Вяз)"},
        {"id": "PINE-001", "type": "Pine (Сосна)"},
        {"id": "SPRUCE-001", "type": "Spruce (Ель)"},
        {"id": "POPLAR-001", "type": "Poplar (Тополь)"},
        {"id": "ASH-001", "type": "Ash (Ясень)"},
        {"id": "ACACIA-001", "type": "Acacia (Акация)"},
        {"id": "ROWAN-001", "type": "Rowan (Рябина)"},
        {"id": "APPLE-001", "type": "Apple (Яблоня)"},
    ]
    
    added_count = 0
    for tree in tree_data:
        existing = db.query(QRCode).filter(QRCode.id == tree["id"]).first()
        if not existing:
            new_qr = QRCode(
                id=tree["id"],
                tree_type=tree["type"],
                water_period=7,
                water_amount="5L",
                description=f"Standard {tree['type']}"
            )
            db.add(new_qr)
            added_count += 1
    
    db.commit()
    return {"status": "success", "added": added_count, "message": "Database synchronized with QR IDs"}