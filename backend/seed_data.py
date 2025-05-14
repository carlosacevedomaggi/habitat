"""Simple seed script to populate the Habitat database with an initial admin user,
a few example properties and some site settings so the frontend UI has
something to display immediately.

Usage (from repo root, with virtual-env activated):

    python -m backend.seed_data

Running it twice is safe – it checks for existing records before inserting.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from .core.database import SessionLocal
from . import models
from .auth import utils as auth_utils
from .models import Role

# ---------------------------------------------------------------------------
# Configuration – feel free to tweak
# ---------------------------------------------------------------------------
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@habitat.com"
ADMIN_PASSWORD = "Admin123!"  # change after first login!

# NEW TEAM MEMBERS -----------------------------------------------------------
TEAM_MEMBERS: list[dict] = [
    {
        "name": "Carlos Acevedo",
        "position": "CEO / Broker",
        "image_url": "https://randomuser.me/api/portraits/men/1.jpg",
        "order": 1,
    },
    {
        "name": "Andrea Gómez",
        "position": "Gerente de Ventas",
        "image_url": "https://randomuser.me/api/portraits/women/44.jpg",
        "order": 2,
    },
    {
        "name": "Luis Pérez",
        "position": "Agente Inmobiliario",
        "image_url": "https://randomuser.me/api/portraits/men/22.jpg",
        "order": 3,
    },
    {
        "name": "María Rodríguez",
        "position": "Agente Inmobiliario",
        "image_url": "https://randomuser.me/api/portraits/women/68.jpg",
        "order": 4,
    },
    {
        "name": "José Martínez",
        "position": "Coordinador de Marketing",
        "image_url": "https://randomuser.me/api/portraits/men/55.jpg",
        "order": 5,
    },
    {
        "name": "Paola Sánchez",
        "position": "Asistente Administrativa",
        "image_url": "https://randomuser.me/api/portraits/women/12.jpg",
        "order": 6,
    },
]

# SAMPLE PROPERTIES -----------------------------------------------------------
SAMPLE_PROPERTIES = [
    {
        "title": "Apartamento moderno en Altamira",
        "description": "Amplio apartamento con vista panorámica de la ciudad, piso alto, remodelado.",
        "price": 190000,
        "location": "Altamira, Caracas",
        "property_type": "Apartamento",
        "listing_type": "Venta",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 140,
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1598928506312-3d576b11ec59?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600047500462-4bb3aa049277?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.495,
        "longitude": -66.849,
        "is_featured": True,
    },
    {
        "title": "Casa familiar en La Lagunita",
        "description": "Hermosa casa de dos plantas con amplio jardín y piscina.",
        "price": 350000,
        "location": "La Lagunita, Caracas",
        "property_type": "Casa",
        "listing_type": "Venta",
        "bedrooms": 4,
        "bathrooms": 4,
        "area": 380,
        "image_url": "https://images.unsplash.com/photo-1572120360610-d971b9ed5a11?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1572120360610-d971b9ed5a11?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560185127-6d8e1f534f3e?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.434,
        "longitude": -66.856,
        "is_featured": False,
    },
    {
        "title": "Oficina en Las Mercedes",
        "description": "Oficina amoblada lista para operar en el corazón financiero.",
        "price": 1200,
        "location": "Las Mercedes, Caracas",
        "property_type": "Oficina",
        "listing_type": "Renta",
        "bedrooms": None,
        "bathrooms": 1,
        "area": 85,
        "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.487,
        "longitude": -66.869,
        "is_featured": False,
    },
    {
        "title": "Townhouse en Lomas del Sol",
        "description": "Townhouse moderno con 3 niveles y terraza privada.",
        "price": 270000,
        "location": "Lomas del Sol, Caracas",
        "property_type": "Townhouse",
        "listing_type": "Venta",
        "bedrooms": 3,
        "bathrooms": 3,
        "area": 240,
        "image_url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b913?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.450,
        "longitude": -66.870,
        "is_featured": True,
    },
    {
        "title": "Apartamento tipo estudio en Los Palos Grandes",
        "description": "Ideal para ejecutivos, cerca del metro y restaurantes.",
        "price": 650,
        "location": "Los Palos Grandes, Caracas",
        "property_type": "Apartamento",
        "listing_type": "Renta",
        "bedrooms": 1,
        "bathrooms": 1,
        "area": 45,
        "image_url": "https://images.unsplash.com/photo-1613553481682-7f1c27a5096d?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1613553481682-7f1c27a5096d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1531973957888-7c83237b3e59?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.504,
        "longitude": -66.845,
        "is_featured": False,
    },
    # Add a couple more for variety
    {
        "title": "Galpón industrial en Guarenas",
        "description": "Espacio industrial amplio con fácil acceso a la autopista.",
        "price": 800000,
        "location": "Zona Industrial, Guarenas",
        "property_type": "Local Comercial",
        "listing_type": "Venta",
        "bedrooms": None,
        "bathrooms": 2,
        "area": 1500,
        "image_url": "https://images.unsplash.com/photo-1597007516040-7a6b11c3677d?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1597007516040-7a6b11c3677d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.473,
        "longitude": -66.536,
        "is_featured": False,
    },
    {
        "title": "Casa de playa en Chirimena",
        "description": "Casa frente al mar con piscina infinita y acceso privado a la playa.",
        "price": 450000,
        "location": "Chirimena, Miranda",
        "property_type": "Casa",
        "listing_type": "Venta",
        "bedrooms": 5,
        "bathrooms": 5,
        "area": 420,
        "image_url": "https://images.unsplash.com/photo-1507086183803-83f5b01b1d4a?auto=format&fit=crop&w=800&q=80",
        "images": [
            "https://images.unsplash.com/photo-1507086183803-83f5b01b1d4a?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 10.426,
        "longitude": -66.185,
        "is_featured": True,
    },
]

# Auto-generate additional sample properties so total is ~40
for i in range(len(SAMPLE_PROPERTIES)+1, 41):
    SAMPLE_PROPERTIES.append({
        "title": f"Apartamento demo #{i} en Caracas",
        "description": "Propiedad de prueba generada automáticamente para poblar el catálogo.",
        "price": 50000 + i * 1000,
        "location": "Caracas, Venezuela",
        "property_type": "Apartamento" if i % 2 == 0 else "Casa",
        "listing_type": "Venta" if i % 3 else "Renta",
        "bedrooms": (i % 5) + 1,
        "bathrooms": (i % 3) + 1,
        "area": 50 + (i % 10) * 10,
        "image_url": f"https://picsum.photos/seed/prop{i}/800/600",
        "images": [
            f"https://picsum.photos/seed/prop{i}a/800/600",
            f"https://picsum.photos/seed/prop{i}b/800/600",
        ],
        "latitude": 10.4 + (i % 10) * 0.01,
        "longitude": -66.9 + (i % 10) * 0.01,
        "is_featured": i % 7 == 0,
    })

SITE_SETTINGS = {
    "site_name": {"value": "Habitat Inmuebles", "category": "General"},
    "contact_email": {"value": "info@habitat.com", "category": "Contact"},
    "contact_phone": {"value": "+58 412-1234567", "category": "Contact"},
    "contact_address": {"value": "Av. Principal, Caracas", "category": "Contact"},
    "office_latitude": {"value": "10.491", "category": "Contact"},
    "office_longitude": {"value": "-66.879", "category": "Contact"},
}

# ---------------------------------------------------------------------------
# Seeder implementation
# ---------------------------------------------------------------------------

def main():
    db: Session = SessionLocal()
    try:
        seed_admin(db)
        seed_properties(db)
        seed_team(db)
        seed_settings(db)
        print("✔ Seed completed. You can now log in with admin / Admin123! (change the password).")
    finally:
        db.close()


def seed_admin(db: Session):
    if db.query(models.User).filter(models.User.username == ADMIN_USERNAME).first():
        print("Admin user already exists – skipping.")
        return

    hashed_pwd = auth_utils.get_password_hash(ADMIN_PASSWORD)
    admin = models.User(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password_hash=hashed_pwd,
        role=Role.admin,
    )
    db.add(admin)
    db.commit()
    print("Admin user created.")


def seed_properties(db: Session):
    existing = db.query(models.Property).count()
    if existing >= len(SAMPLE_PROPERTIES):
        print("Properties already seeded – skipping sample insertion.")
        return

    for prop in SAMPLE_PROPERTIES:
        prop_data = prop.copy()
        images = prop_data.pop("images", [])
        db_prop = models.Property(**prop_data, created_at=datetime.utcnow())
        db.add(db_prop)
        db.commit()
        db.refresh(db_prop)

        # create gallery images
        for idx, img_url in enumerate(images):
            db.add(models.PropertyImage(property_id=db_prop.id, image_url=img_url, order=idx))
        db.commit()
    print(f"Inserted {len(SAMPLE_PROPERTIES)} sample properties with images.")


def seed_team(db: Session):
    existing = db.query(models.TeamMember).count()
    if existing >= len(TEAM_MEMBERS):
        print("Team members already seeded – skipping.")
        return

    for member in TEAM_MEMBERS:
        if not db.query(models.TeamMember).filter(models.TeamMember.name == member["name"]).first():
            db.add(models.TeamMember(**member))
    db.commit()
    print(f"Inserted/updated {len(TEAM_MEMBERS)} team members.")


def seed_settings(db: Session):
    for key, data in SITE_SETTINGS.items():
        row = db.query(models.SiteSettings).filter(models.SiteSettings.key == key).first()
        desired_val = data["value"]
        # Ensure value is a dict per schema
        if not isinstance(desired_val, dict):
            desired_val = {"text": desired_val}

        if row:
            # If existing row has wrong type, fix it
            if not isinstance(row.value, dict):
                row.value = desired_val
                row.category = data["category"]
        else:
            db.add(models.SiteSettings(key=key, value=desired_val, category=data["category"]))
    db.commit()
    print("Basic site settings stored / updated.")


if __name__ == "__main__":
    main() 