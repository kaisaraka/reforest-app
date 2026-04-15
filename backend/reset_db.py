from sqlalchemy import create_engine
# Замени 'database' и 'models' на названия твоих файлов, если они отличаются
from database import Base
import models 

# Вставь сюда свою ссылку на базу данных (ту самую, которая postgresql://...)
DATABASE_URL = "postgresql://reforest_db_2_user:hlltWWiv0OYJoB05UAZQwcy5dJpxpncr@dpg-d74o3c1r0fns73d2ce20-a.frankfurt-postgres.render.com/reforest_db_2"

engine = create_engine(DATABASE_URL)

print("Удаляем старые данные и таблицы...")
Base.metadata.drop_all(bind=engine)

print("Создаем чистые таблицы...")
Base.metadata.create_all(bind=engine)

print("Готово! База чиста как слеза.")