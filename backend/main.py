from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Импорты твоих модулей
import models
from models import User, QRCode
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

# --- НАСТРОЙКА ПАРОЛЕЙ ---
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

# --- 1. ГЛАВНАЯ СТРАНИЦА (Чтобы не было 404) ---
@app.get("/")
def home():
    return {"status": "success", "message": "DeForest API is running"}

# --- 2. РЕГИСТРАЦИЯ ---
@app.post("/register")
def register(user_data: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pw, score=0)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "score": 0}

# --- 3. ВХОД (LOGIN) ---
@app.post("/login")
def login(user_data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверное имя или пароль")
    
    return {"id": user.id, "username": user.username, "score": user.score}

# --- 4. ПРОВЕРКА QR-КОДА ПО ТВОЕЙ БАЗЕ ---
@app.post("/verify-qr")
def verify_qr(request: QRVerifyRequest, db: Session = Depends(get_db)):
    # Ищем код в таблице QRCode (убедись, что поле в QRCode называется code)
    qr_entry = db.query(QRCode).filter(QRCode.code == request.qr_data).first()
    
    if not qr_entry:
        raise HTTPException(status_code=400, detail="QR Code Invalid")

    # Ищем пользователя
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Начисляем 1 очко
    user.score += 1
    db.commit()
    db.refresh(user)

    return {
        "status": "success", 
        "new_score": user.score, 
        "message": "Tree verified!"
    }

# --- 5. ТОП ПОЛЬЗОВАТЕЛЕЙ ---
@app.get("/top-users")
def get_top_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.score.desc()).limit(10).all()
    return users