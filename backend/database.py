from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 1. Получаем ссылку от Render
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- 🔥 ИСПРАВЛЕНИЕ ОШИБКИ 500 ---
# Если ссылка начинается с postgres://, меняем её на postgresql://
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
# ---------------------------------

# 2. Подключаемся к базе
if not SQLALCHEMY_DATABASE_URL:
    # Для локального запуска
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Для сервера (Render)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()