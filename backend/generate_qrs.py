import qrcode
import os

# Те же данные, что мы добавили в init_db_data в main.py
tree_types = [
    {"id": "ELM-001", "name": "Elm (Вяз)"},
    {"id": "PINE-001", "name": "Pine (Сосна)"},
    {"id": "SPRUCE-001", "name": "Spruce (Ель)"},
    {"id": "POPLAR-001", "name": "Poplar (Тополь)"},
    {"id": "ASH-001", "name": "Ash (Ясень)"},
    {"id": "ACACIA-001", "name": "Acacia (Акация)"},
    {"id": "ROWAN-001", "name": "Rowan (Рябина)"},
    {"id": "APPLE-001", "name": "Apple (Яблоня)"},
]

# Создаем папку, если нет
if not os.path.exists("qrcodes_images"):
    os.makedirs("qrcodes_images")

print("Generating QR Codes...")

for tree in tree_types:
    # Создаем QR код с ID (именно этот ID ищет бэкенд)
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=5,
    )
    qr.add_data(tree["id"])
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Сохраняем файл
    filename = f"qrcodes_images/{tree['name']}.png"
    img.save(filename)
    print(f"Saved: {filename}")

print("\nDone! Check the 'qrcodes_images' folder.")