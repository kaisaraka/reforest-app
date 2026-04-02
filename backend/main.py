import os
import io
import random
from datetime import datetime
from typing import List, Optional
from PIL import Image, ExifTags

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from dotenv import load_dotenv

import cloudinary
import cloudinary.uploader

import models
from models import User, QRCode, Tree, WateringEvent, ActivityLog
from database import engine, SessionLocal, get_db

load_dotenv()
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReForest API")

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

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure = True
)

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    role: str
    first_name: str
    last_name: str
    patronymic: Optional[str] = None
    email: str
    password: str
    shanyraq: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str

class QRVerifyRequest(BaseModel):
    qr_data: str
    user_id: int

class WateringHistoryItem(BaseModel):
    username: str
    timestamp: datetime
    image_data: Optional[str] = None

class TreeResponse(BaseModel):
    id: int
    pos: list 
    status: str
    tree_type: str
    user: str
    water_amount: str
    days_left: int
    created_at: datetime
    image_data: Optional[str] = None
    history: List[WateringHistoryItem] = []

class ActivityLogItem(BaseModel):
    action: str
    points: int
    details: str
    timestamp: datetime

async def upload_image_to_cloud(file: UploadFile) -> str:
    try:
        content = await file.read()
        result = cloudinary.uploader.upload(content, folder="reforest")
        return result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Error uploading photo to cloud")

def get_decimal_from_dms(dms, ref):
    degrees = dms[0]
    minutes = dms[1]
    seconds = dms[2]
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']: decimal = -decimal
    return decimal

def get_image_gps(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif = img._getexif()
        if not exif: return None
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
    except: return None

@app.get("/")
def home(): 
    return {"status": "success", "message": "ReForest API is running with Cloudinary"}

@app.post("/reset-db")
def reset_database(db: Session = Depends(get_db)):
    try:
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)
        return {"status": "success", "message": "Tables dropped and recreated!"}
    except Exception as e: 
        return {"status": "error", "message": str(e)}

@app.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if len(user_data.password) < 7:
        raise HTTPException(status_code=400, detail="Password must contain at least 7 characters")

    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed_pwd = get_password_hash(user_data.password)
    username = f"{user_data.first_name} {user_data.last_name}".strip()
    
    new_user = User(
        email=user_data.email,
        username=username,
        hashed_password=hashed_pwd,
        role=user_data.role,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        patronymic=user_data.patronymic,
        shanyraq=user_data.shanyraq,
        score=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "email": new_user.email, "role": new_user.role, "score": 0}

@app.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"id": user.id, "username": user.username, "email": user.email, "role": user.role, "score": user.score, "shanyraq": user.shanyraq}

@app.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return {"success": True, "message": "Code sent to email"}

@app.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(req.new_password) < 7:
        raise HTTPException(status_code=400, detail="Password must contain at least 7 characters")
    return {"success": True, "message": "Password changed"}

@app.post("/user/refresh")
def refresh_user_data(user_id: int = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "score": user.score}

@app.post("/verify-qr")
def verify_qr(request: QRVerifyRequest, db: Session = Depends(get_db)):
    if request.qr_data == "CHECK_USER_ALIVE":
        if not db.query(User).filter(User.id == request.user_id).first(): 
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "alive"}
    qr_entry = db.query(QRCode).filter(QRCode.id == request.qr_data).first()
    if not qr_entry: raise HTTPException(status_code=400, detail="QR Code Invalid")
    return {"status": "success", "qr_code": qr_entry.id, "tree_type": qr_entry.tree_type}

@app.post("/seed-qr")
def seed_qr(db: Session = Depends(get_db)):
    tree_data = [{"id": "ELM-001", "type": "Elm"}, {"id": "PINE-001", "type": "Pine"}, {"id": "OAK-001", "type": "Oak"}]
    for tree in tree_data:
        if not db.query(QRCode).filter(QRCode.id == tree["id"]).first():
            db.add(QRCode(id=tree["id"], tree_type=tree["type"], water_period=7, water_amount="5L", description="Tree"))
    db.commit()
    return {"status": "success"}

@app.get("/forest", response_model=List[TreeResponse])
def get_forest(db: Session = Depends(get_db)):
    trees = db.query(Tree).all()
    result = []
    now = datetime.utcnow()
    
    for t in trees:
        history_list = [{"username": event.user.username, "timestamp": event.timestamp, "image_data": event.image_data} for event in t.history]
        t_type = t.tree_type if t.tree_type else "Wild Tree"
        
        days_passed = (now - t.last_watered_date).days
        
        if days_passed >= 10:
            status = "red"
        elif days_passed >= 8:
            status = "yellow"
        else:
            status = "green"
            
        days_left = max(0, 8 - days_passed)
        
        result.append({
            "id": t.id,
            "pos": [t.lat, t.lon],
            "status": status,
            "tree_type": t_type,
            "user": t.owner.username if t.owner else "Unknown",
            "water_amount": "2L",
            "days_left": days_left,
            "created_at": t.created_at,
            "image_data": t.image_data,
            "history": history_list
        })
    return result

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.score.desc()).limit(10).all()

@app.post("/user/history", response_model=List[ActivityLogItem])
def get_user_history(user_id: int = Form(...), db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == user_id).order_by(ActivityLog.timestamp.desc()).limit(50).all()
    return [{"action": log.action, "points": log.points, "details": log.details, "timestamp": log.timestamp} for log in logs]

@app.post("/predict")
async def predict_tree(
    file: UploadFile = File(...),
    username: str = Form(...),
    tree_type: str = Form("Wild Tree"), 
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    qr_code_id: Optional[str] = Form(None), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    file_bytes = await file.read()
    await file.seek(0)
    
    final_lat, final_lon = lat, lon
    if final_lat is None:
        coords = get_image_gps(file_bytes)
        if coords:
            final_lat, final_lon = coords[0], coords[1]
        else:
            final_lat, final_lon = 42.8953 + random.uniform(-0.01, 0.01), 71.3737 + random.uniform(-0.01, 0.01)

    image_url = await upload_image_to_cloud(file)
    now = datetime.utcnow()
    
    new_tree = Tree(
        lat=final_lat, 
        lon=final_lon, 
        owner_id=user.id, 
        qr_code_id=qr_code_id, 
        tree_type=tree_type,   
        image_data=image_url, 
        created_at=now,
        last_watered_date=now
    )
    
    POINTS = 100
    user.score += POINTS
    db.add(ActivityLog(user_id=user.id, action="planted", points=POINTS, details=f"Planted {tree_type}"))
    db.add(new_tree)
    db.commit()
    
    return {"success": True, "image_url": image_url, "coords": [final_lat, final_lon]}

@app.post("/water")
async def water_tree(
    tree_id: int = Form(...), 
    username: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    tree = db.query(Tree).filter(Tree.id == tree_id).first()
    if not user or not tree: raise HTTPException(status_code=404, detail="Not found")

    image_url = await upload_image_to_cloud(file)
    now = datetime.utcnow()

    new_event = WateringEvent(
        tree_id=tree.id, 
        user_id=user.id, 
        image_data=image_url, 
        timestamp=now
    )
    
    tree.last_watered_date = now
    
    POINTS = 30
    user.score += POINTS
    db.add(ActivityLog(user_id=user.id, action="watered", points=POINTS, details=f"Watered tree #{tree_id}"))
    db.add(new_event)
    db.commit()
    
    return {"success": True, "message": "Watered", "image_url": image_url}