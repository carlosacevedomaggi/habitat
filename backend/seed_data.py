"""Simple seed script to populate the Habitat database with an initial admin user,
a few example properties and some site settings so the frontend UI has
something to display immediately.

Usage (from repo root, with virtual-env activated):

    python -m backend.seed_data

Running it twice is safe – it checks for existing records before inserting.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from core.database import SessionLocal
import models
from auth import utils as auth_utils
from models import Role

# ---------------------------------------------------------------------------
# Configuration – feel free to tweak
# ---------------------------------------------------------------------------
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@habitat.com"
ADMIN_PASSWORD = "Admin123!"  # change after first login!

# NEW TEAM MEMBERS -----------------------------------------------------------
TEAM_MEMBERS: list[dict] = [
    {
        "name": "Member One",
        "position": "Position One",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093556_0000.jpg",
        "order": 1,
    },
    {
        "name": "Member Two",
        "position": "Position Two",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093556_0001.jpg",
        "order": 2,
    },
    {
        "name": "Member Three",
        "position": "Position Three",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093556_0002.jpg",
        "order": 3,
    },
    {
        "name": "Member Four",
        "position": "Position Four",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093557_0003.jpg",
        "order": 4,
    },
    {
        "name": "Member Five",
        "position": "Position Five",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093557_0004.jpg",
        "order": 5,
    },
    {
        "name": "Member Six",
        "position": "Position Six",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093557_0005.jpg",
        "order": 6,
    },
    {
        "name": "Member Seven",
        "position": "Position Seven",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_093557_0006.jpg",
        "order": 7,
    },
    {
        "name": "Member Eight",
        "position": "Position Eight",
        "image_url": "/static/uploads/team/Asesora de imagen_20250519_122049_0000.jpg",
        "order": 8,
    },
    {
        "name": "Member Nine",
        "position": "Position Nine",
        "image_url": "/static/uploads/team/WhatsApp Image 2025-05-19 at 9.23.08 AM.jpeg",
        "order": 9,
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
    "facebook_profile_url": {"value": {"text": "https://facebook.com/yourpage"}, "category": "Social"},
    "instagram_profile_url": {"value": {"text": "https://instagram.com/yourprofile"}, "category": "Social"},
    "tiktok_profile_url": {"value": {"text": "https://tiktok.com/@yourprofile"}, "category": "Social"},
    "linkedin_profile_url": {"value": {"text": "https://linkedin.com/in/yourprofile"}, "category": "Social"},
    "whatsapp_contact_url": {"value": {"text": "https://wa.me/1234567890"}, "category": "Social"},
    "about_page_main_title": {"value": {"text": "Sobre Nosotros (Default Title)"}, "category": "AboutPage"},
    "about_page_main_paragraph": {"value": {"text": "Comprometidos con encontrar tu espacio ideal. (Default paragraph from seed)"}, "category": "AboutPage"},
    "about_page_mission_title": {"value": {"text": "Nuestra Misión (Default Title)"}, "category": "AboutPage"},
    "about_page_mission_paragraph": {"value": {"text": "Facilitar a nuestros clientes el proceso de encontrar y adquirir la propiedad de sus sueños... (Default paragraph from seed)"}, "category": "AboutPage"},
    "about_page_vision_title": {"value": {"text": "Nuestra Visión (Default Title)"}, "category": "AboutPage"},
    "about_page_vision_paragraph": {"value": {"text": "Ser la agencia inmobiliaria líder y más respetada en Caracas y sus alrededores... (Default paragraph from seed)"}, "category": "AboutPage"},
    "about_page_history_title": {"value": {"text": "Nuestra Historia"}, "category": "AboutPage"},
    "about_page_history_paragraph": {"value": {"text": "Con más de una década de experiencia en el sector inmobiliario de Caracas, Habitat se ha consolidado como un referente de confianza y profesionalismo. Desde nuestros inicios, hemos trabajado con la visión de transformar la manera en que las personas encuentran y adquieren propiedades, enfocándonos en un servicio personalizado y resultados excepcionales."}, "category": "AboutPage"},
    "footer_tagline": {"value": {"text": "Tu socio confiable en bienes raíces. (Default from seed)"}, "category": "Footer"},

    # New Theme Color Settings
    "theme_primary_color": {"value": "#282e4b", "category": "ThemeColors"},
    "theme_secondary_color": {"value": "#242c3c", "category": "ThemeColors"},
    "theme_accent_color": {"value": "#c8a773", "category": "ThemeColors"},
    "theme_text_color_on_dark": {"value": "#FFFFFF", "category": "ThemeColors"},
    "theme_background_primary": {"value": "#1A1A1A", "category": "ThemeColors"},
    "theme_background_secondary": {"value": "#1f2937", "category": "ThemeColors"},
    "theme_header_background_color": {"value": "#f3f4f6", "category": "ThemeColors"},
    "theme_header_text_color": {"value": "#111827", "category": "ThemeColors"},
    "theme_footer_background_color": {"value": "#f3f4f6", "category": "ThemeColors"},
    "theme_footer_text_color": {"value": "#111827", "category": "ThemeColors"},
    "theme_border_color": {"value": "#4b5563", "category": "ThemeColors"},
    "theme_success_color": {"value": "#16a34a", "category": "ThemeColors"},
    "theme_error_color": {"value": "#dc2626", "category": "ThemeColors"},
    "theme_info_color": {"value": "#3b82f6", "category": "ThemeColors"},
    "theme_warning_color": {"value": "#eab308", "category": "ThemeColors"},
    "theme_text_color_primary_lightbg": {"value": "#111827", "category": "ThemeColors"},
    "theme_text_color_secondary_lightbg": {"value": "#6b7280", "category": "ThemeColors"},
    "home_background_url": {"value": "/images/default-hero-bg.jpg", "category": "Appearance"},
    "non_admin_can_view_all_contacts": {"value": True, "category": "Permissions"}
}

# ---------------------------------------------------------------------------
# Seeder implementation
# ---------------------------------------------------------------------------

def main():
    db: Session = SessionLocal()
    try:
        seed_admin(db)
        seed_users(db)
        seed_properties(db)
        seed_contacts(db)
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


def seed_users(db: Session):
    """Seed sample manager and staff users for demo."""
    sample_users = [
        {"username": "manager1", "email": "manager1@example.com", "password": "Password123!", "role": Role.manager},
        {"username": "manager2", "email": "manager2@example.com", "password": "Password123!", "role": Role.manager},
        {"username": "staff1", "email": "staff1@example.com", "password": "Password123!", "role": Role.staff},
        {"username": "staff2", "email": "staff2@example.com", "password": "Password123!", "role": Role.staff},
        {"username": "staff3", "email": "staff3@example.com", "password": "Password123!", "role": Role.staff},
    ]
    created = []
    for u in sample_users:
        if not db.query(models.User).filter(models.User.username == u["username"]).first():
            pwd_hash = auth_utils.get_password_hash(u["password"])
            user = models.User(username=u["username"], email=u["email"], password_hash=pwd_hash, role=u["role"])
            db.add(user)
            created.append(u["username"])
    db.commit()
    if created:
        print(f"Inserted sample users: {', '.join(created)}")
    else:
        print("Sample users already exist – skipping.")


def seed_contacts(db: Session):
    """Seed sample contact submissions for demo."""
    users = db.query(models.User).all()
    properties = db.query(models.Property).limit(10).all()
    import random
    sample_contacts = []
    for i in range(1, 21):
        prop = random.choice(properties)
        user = random.choice(users)
        sample_contacts.append({
            "name": f"Contact {i}",
            "email": f"contact{i}@example.com",
            "phone": f"555-010{i:02d}",
            "subject": "Inquiry about property",
            "message": f"Hi, I'm interested in property ID {prop.id}. Please provide more details.",
            "property_id": prop.id,
            "assigned_to_id": user.id if user.role != Role.staff else None
        })
    created = 0
    for c in sample_contacts:
        if not db.query(models.Contact).filter(models.Contact.email == c["email"]).first():
            contact = models.Contact(**c)
            db.add(contact)
            created += 1
    db.commit()
    if created:
        print(f"Inserted {created} sample contact submissions")
    else:
        print("Sample contacts already exist – skipping.")


def seed_properties(db: Session):
    existing = db.query(models.Property).count()
    # If sample properties exist, update their coordinates and area fields
    if existing >= len(SAMPLE_PROPERTIES):
        print("Properties already seeded – updating coordinates and area.")
        for prop in SAMPLE_PROPERTIES:
            db_prop = db.query(models.Property).filter(models.Property.title == prop["title"]).first()
            if db_prop:
                # Update coordinates if provided in seed
                if "latitude" in prop:
                    db_prop.latitude = prop["latitude"]
                if "longitude" in prop:
                    db_prop.longitude = prop["longitude"]
                # Update area (square_feet) if seed data had area
                if "area" in prop:
                    db_prop.square_feet = prop["area"]
                db.add(db_prop)
        db.commit()
        print("Updated latitude/longitude and area for existing properties.")
        return

    for prop in SAMPLE_PROPERTIES:
        prop_data = prop.copy()
        images = prop_data.pop("images", [])
        # Map legacy fields to current model fields and remove unused keys
        if "area" in prop_data:
            prop_data["square_feet"] = prop_data.pop("area")
        # Remove fields no longer in Property model
        prop_data.pop("listing_type", None)
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
    updated_count = 0
    created_count = 0
    for member_data in TEAM_MEMBERS:
        existing_member = db.query(models.TeamMember).filter(models.TeamMember.name == member_data["name"]).first()
        if existing_member:
            # Update existing member if data differs
            changed = False
            if existing_member.position != member_data["position"]:
                existing_member.position = member_data["position"]
                changed = True
            if existing_member.image_url != member_data["image_url"]:
                existing_member.image_url = member_data["image_url"]
                changed = True
            if existing_member.order != member_data["order"]:
                existing_member.order = member_data["order"]
                changed = True
            
            if changed:
                db.add(existing_member)
                updated_count += 1
        else:
            # Add new member
            db.add(models.TeamMember(**member_data))
            created_count += 1
    db.commit()
    if created_count > 0:
        print(f"Inserted {created_count} new team members.")
    if updated_count > 0:
        print(f"Updated {updated_count} existing team members.")
    if created_count == 0 and updated_count == 0:
        print("Team members are already up to date.")


def seed_settings(db: Session):
    for key, data in SITE_SETTINGS.items():
        row = db.query(models.SiteSettings).filter(models.SiteSettings.key == key).first()
        desired_val = data["value"]
        
        # Ensure value is a dict {text: "..."} if it's a simple string and key is not a color or URL
        # For colors and specific URLs, store the string directly.
        # For other text-based settings, wrap in {"text": "..."}
        if isinstance(desired_val, str) and not key.endswith(('_color', '_url')):
             desired_val = {"text": desired_val}
        elif isinstance(desired_val, str) and key.endswith('_color'): # Store colors as direct strings
            pass # Keep desired_val as string e.g. "#FFFFFF"
        elif isinstance(desired_val, str) and key.endswith('_url'): # Store URLs as direct strings
            pass # Keep desired_val as string e.g. "http://..."

        if row:
            # If existing row has wrong type for colors/URLs, or needs wrapping for text
            if key.endswith(('_color', '_url')):
                if isinstance(row.value, dict) and 'text' in row.value: # Convert from {"text":"#color"} to "#color"
                    row.value = row.value['text']
                elif not isinstance(row.value, str): # If it's some other dict, overwrite
                     row.value = desired_val 
            elif not isinstance(row.value, dict) or 'text' not in row.value : # Ensure text values are wrapped
                 row.value = desired_val if isinstance(desired_val, dict) else {"text": str(desired_val)}
            
            # Always update category from seed if it differs, to allow moving settings between categories
            if row.category != data["category"]:
                row.category = data["category"]

            # Only update value if it changed, to avoid unnecessary DB writes (optional)
            # For simplicity here, we'll just set it. If complex diffing is needed, add it.
            row.value = desired_val # Update value based on above logic
        else:
            # For new entries, ensure colors/URLs are direct strings, others are wrapped
            final_value = desired_val
            if isinstance(desired_val, str) and not key.endswith(('_color', '_url')):
                final_value = {"text": desired_val}
            elif isinstance(desired_val, dict) and 'text' in desired_val and key.endswith(('_color', '_url')):
                # if seed data for color had {"text": "#value"}, extract "#value"
                final_value = desired_val['text']


            db.add(models.SiteSettings(key=key, value=final_value, category=data["category"]))
    db.commit()
    print("Basic site settings stored / updated.")


if __name__ == "__main__":
    main() 