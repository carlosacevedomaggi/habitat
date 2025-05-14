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

# ---------------------------------------------------------------------------
# Configuration – feel free to tweak
# ---------------------------------------------------------------------------
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@habitat.com"
ADMIN_PASSWORD = "Admin123!"  # change after first login!

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
        "latitude": 10.434,
        "longitude": -66.856,
        "is_featured": False,
    },
]

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
        is_admin=True,
        is_editor=True,
    )
    db.add(admin)
    db.commit()
    print("Admin user created.")


def seed_properties(db: Session):
    existing = db.query(models.Property).count()
    if existing > 0:
        print(f"{existing} properties already present – skipping sample insertion.")
        return

    for prop in SAMPLE_PROPERTIES:
        db.add(models.Property(**prop, created_at=datetime.utcnow()))
    db.commit()
    print("Sample properties inserted.")


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