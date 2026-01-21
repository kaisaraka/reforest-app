from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import random
from PIL import Image, ExifTags # <--- Для работы с картинками
import io

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

# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ GPS ---
def get_decimal_from_dms(dms, ref):
    """Переводит градусы/минуты/секунды в десятичные координаты"""
    degrees = dms[0]
    minutes = dms[1]
    seconds = dms[2]
    
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def get_image_gps(image_bytes):
    """Вытаскивает GPS из байтов изображения"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif = image._getexif()
        
        if not exif:
            return None

        gps_info = {}
        for tag, value in exif.items():
            decoded = ExifTags.TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                for t in value:
                    sub_decoded = ExifTags.GPSTAGS.get(t, t)
                    gps_info[sub_decoded] = value[t]
        
        if 'GPSLatitude' in gps_info and 'GPSLongitude' in gps_info:
            lat = get_decimal_from_dms(gps_info['GPSLatitude'], gps_info['GPSLatitudeRef'])
            lon = get_decimal_from_dms(gps_info['GPSLongitude'], gps_info['GPSLongitudeRef'])
            return [lat, lon]
            
        return None
    except Exception as e:
        print(f"Error reading GPS: {e}")
        return None
# ---------------------------------------

@app.get("/")
def home():
    return {"status": "success", "message": "DeForest API is running"}

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
    # Ищем QR-код в базе
    qr_entry = db.query(QRCode).filter(QRCode.id == request.qr_data).first()
    if not qr_entry:
        raise HTTPException(status_code=400, detail="QR Code Invalid")

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Просто проверяем валидность, но очки пока не начисляем (начислим после фото)
    return {
        "status": "success", 
        "qr_code": qr_entry.id,
        "tree_type": qr_entry.tree_type,
        "message": "QR Valid. Please upload photo."
    }

@app.post("/seed-qr")
def seed_qr(db: Session = Depends(get_db)):
    tree_data = [
        {"id": "ELM-001", "type": "Elm (Вяз)"},
        {"id": "PINE-001", "type": "Pine (Сосна)"},
        {"id": "OAK-001", "type": "Oak (Дуб)"},
    ]
    count = 0
    for tree in tree_data:
        existing = db.query(QRCode).filter(QRCode.id == tree["id"]).first()
        if not existing:
            new_qr = QRCode(id=tree["id"], tree_type=tree["type"], water_period=7, water_amount="5L", description="Tree")
            db.add(new_qr)
            count += 1
    db.commit()
    return {"status": "success", "added": count}

class TreeResponse(BaseModel):
    id: int
    pos: list 
    status: str
    tree_type: str
    user: str
    water_amount: str
    days_left: int

@app.get("/forest", response_model=List[TreeResponse])
def get_forest(db: Session = Depends(get_db)):
    trees = db.query(Tree).all()
    result = []
    for t in trees:
        result.append({
            "id": t.id,
            "pos": [t.lat, t.lon],
            "status": "green", # Логику статуса можно усложнить позже
            "tree_type": t.qr_info.tree_type if t.qr_info else "Unknown",
            "user": t.owner.username if t.owner else "Unknown",
            "water_amount": t.qr_info.water_amount if t.qr_info else "2L",
            "days_left": 5
        })
    return result

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.score.desc()).limit(10).all()

# --- 🔥 ОБНОВЛЕННЫЙ PREDICT С REAL GPS ---
@app.post("/predict")
async def predict_tree(
    file: UploadFile = File(...),      
    username: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return {"success": False, "message": "User not found"}

    # 1. Читаем файл в память
    image_bytes = await file.read()
    
    # 2. Пытаемся достать GPS
    coords = get_image_gps(image_bytes)

    # 3. Если GPS нет (например, фото скачано с интернета или выключена геолокация)
    # Используем запасной вариант (центр + рандом), чтобы приложение не ломалось
    if coords:
        lat, lon = coords
        gps_message = "GPS extracted from photo!"
    else:
        lat = 42.8953 + random.uniform(-0.005, 0.005)
        lon = 71.3737 + random.uniform(-0.005, 0.005)
        gps_message = "No GPS in photo, used estimated location."

    # 4. Сохраняем
    new_tree = Tree(
        lat=lat,
        lon=lon,
        owner_id=user.id,
        qr_code_id="ELM-001", # В идеале передавать ID с фронтенда, пока хардкод для теста
        created_at=datetime.utcnow(),
        last_watered_date=datetime.utcnow()
    )
    
    user.score += 1 # Начисляем очки только ПОСЛЕ фото
    db.add(new_tree)
    db.commit()
    db.refresh(new_tree)

    return {
        "success": True,
        "message": f"Tree planted! {gps_message}",
        "coords": [lat, lon],
        "tree_id": new_tree.id
    }