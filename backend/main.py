from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel  # <--- ВОТ ЭТОГО НЕ ХВАТАЛО!
from passlib.context import CryptContext
from typing import Optional

# Импорты из твоих файлов
import models
from models import User
from database import engine, SessionLocal, get_db

# Создаем таблицы в базе данных (если их нет)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# НАСТРОЙКА ПАРОЛЕЙ
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# СХЕМЫ ДАННЫХ (Pydantic)
class UserAuth(BaseModel):
    username: str
    password: str

# --- ENDPOINT: РЕГИСТРАЦИЯ ---
@app.post("/register")
def register(user_data: UserAuth, db: Session = Depends(get_db)):
    # 1. Проверяем, есть ли такой юзер
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    
    # 2. Создаем нового с зашифрованным паролем
    hashed_pw = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pw, score=0)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "score": 0}

# --- ENDPOINT: ВХОД (LOGIN) ---
@app.post("/login")
def login(user_data: UserAuth, db: Session = Depends(get_db)):
    # 1. Ищем юзера
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Неверное имя пользователя или пароль")
    
    # 2. Проверяем пароль
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверное имя пользователя или пароль")
    
    return {"id": user.id, "username": user.username, "score": user.score}

# --- СЮДА МОЖНО ВЕРНУТЬ ТВОИ ОСТАЛЬНЫЕ ФУНКЦИИ ---
# (verify-qr, get_forest, и т.д., если они у тебя были ниже)