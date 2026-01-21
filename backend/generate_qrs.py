import qrcode
import os

tree_types = [
    {"id": "ELM-001", "name": "Elm_Вяз"},
    {"id": "PINE-001", "name": "Pine_Сосна"},
    {"id": "SPRUCE-001", "name": "Spruce_Ель"},
    {"id": "POPLAR-001", "name": "Poplar_Тополь"},
    {"id": "ASH-001", "name": "Ash_Ясень"},
    {"id": "ACACIA-001", "name": "Acacia_Акация"},
    {"id": "ROWAN-001", "name": "Rowan_Рябина"},
    {"id": "APPLE-001", "name": "Apple_Яблоня"},
]

if not os.path.exists("qrcodes_images"):
    os.makedirs("qrcodes_images")

print("Generating QR Codes...")

for tree in tree_types:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(tree["id"]) # Вшиваем ID
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    filename = f"qrcodes_images/{tree['name']}.png"
    img.save(filename)
    print(f"Generated QR for ID: {tree['id']} (File: {filename})")

print("\nDone! Now upload these IDs to your database using /seed-qr endpoint.")