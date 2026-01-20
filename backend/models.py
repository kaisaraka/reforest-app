from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    # НОВОЕ ПОЛЕ: Храним не пароль, а его хеш!
    hashed_password = Column(String) 
    score = Column(Integer, default=0)
    trees = relationship("Tree", back_populates="owner")

# ... (Остальные модели QRCode и Tree остаются без изменений)
class QRCode(Base):
    __tablename__ = "qr_codes"
    id = Column(String, primary_key=True, index=True)
    tree_type = Column(String)
    water_period = Column(Integer)
    water_amount = Column(String)
    description = Column(String)
    tree = relationship("Tree", back_populates="qr_info", uselist=False)

class Tree(Base):
    __tablename__ = "trees"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lon = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_watered_date = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="trees")
    qr_code_id = Column(String, ForeignKey("qr_codes.id"))
    qr_info = relationship("QRCode", back_populates="tree")