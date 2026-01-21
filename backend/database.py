from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Получаем ссылку на базу данных
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
# Если Render дает ссылку postgres://, мы меняем её на postgresql://
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
# ------------------------------

if not SQLALCHEMY_DATABASE_URL:
    # Если запускаем на компьютере без интернета
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Если запускаем на Render
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()