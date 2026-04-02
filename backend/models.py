from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True) 
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) 
    role = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    patronymic = Column(String, nullable=True)
    shanyraq = Column(String, nullable=True)
    score = Column(Integer, default=0)
    
    trees = relationship("Tree", back_populates="owner")
    waterings = relationship("WateringEvent", back_populates="user")
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")

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
    image_data = Column(Text, nullable=True) 
    tree_type = Column(String, default="Unknown Tree")

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="trees")
    
    qr_code_id = Column(String, ForeignKey("qr_codes.id"), nullable=True)
    qr_info = relationship("QRCode", back_populates="tree")

    history = relationship("WateringEvent", back_populates="tree", cascade="all, delete-orphan")

class WateringEvent(Base):
    __tablename__ = "watering_events"
    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    image_data = Column(Text, nullable=True)

    tree = relationship("Tree", back_populates="history")
    user = relationship("User", back_populates="waterings")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    points = Column(Integer)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")