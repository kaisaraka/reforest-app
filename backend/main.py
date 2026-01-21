from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime

# Импорты твоих файлов
import models
from models import User, QRCode, Tree
from database import engine, SessionLocal, get_db

# Создаем таблицы в базе данных
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- НАСТРОЙКА CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ШИФРОВАНИЕ ПАРОЛЕЙ ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- СХЕМЫ ДАННЫХ (Pydantic) ---
class UserAuth(BaseModel):
    username: str
    password: str

class QRVerifyRequest(BaseModel):
    qr_data: str
    user_id: int
    lat: Optional[float] = 0.0
    lon: Optional[float] = 0.0

# --- ЭНДПОИНТЫ: AUTH ---

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

# --- ЭНДПОИНТ: ПРОВЕРКА QR И "ПОСАДКА" ДЕРЕВА ---

@app.post("/verify-qr")
def verify_qr(request: QRVerifyRequest, db: Session = Depends(get_db)):
    # 1. Ищем QR-код в твоей базе (по полю id, как в твоем models.py)
    qr_entry = db.query(QRCode).filter(QRCode.id == request.qr_data).first()
    
    if not qr_entry:
        raise HTTPException(status_code=400, detail="QR Code Invalid")

    # 2. Ищем пользователя
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Создаем запись о новом дереве (Planting)
    new_tree = Tree(
        lat=request.lat,
        lon=request.lon,
        owner_id=user.id,
        qr_code_id=qr_entry.id,
        created_at=datetime.utcnow(),
        last_watered_date=datetime.utcnow()
    )
    db.add(new_tree)

    # 4. Обновляем счетчик пользователя
    user.score += 1
    
    db.commit()
    db.refresh(user)

    return {
        "status": "success", 
        "new_score": user.score, 
        "tree_id": new_tree.id,
        "message": f"Successfully planted a {qr_entry.tree_type}!"
    }

# --- ЭНДПОИНТ: ТОП ПОЛЬЗОВАТЕЛЕЙ ---
@app.get("/users/top")
def get_top_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.score.desc()).limit(10).all()

# --- ТЕСТОВЫЙ ЭНДПОИНТ: ДОБАВИТЬ QR В БАЗУ (чтобы ты мог проверить) ---
@app.post("/seed-qr")
def seed_qr(db: Session = Depends(get_db)):
    # Добавляем тестовый код, если его еще нет
    test_code = "TREE_2026"
    existing = db.query(QRCode).filter(QRCode.id == test_code).first()
    if not existing:
        new_qr = QRCode(
            id=test_code,
            tree_type="Oak",
            water_period=7,
            water_amount="5L",
            description="A beautiful young oak."
        )
        db.add(new_qr)
        db.commit()
        return {"message": f"QR Code '{test_code}' added to database for testing!"}
    return {"message": "Test QR already exists."}