from sqlalchemy.orm import Session
from .. import models, schemas
from datetime import datetime
from typing import Optional

def create_property_click(db: Session, property_id: int, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> models.PropertyClick:
    """
    Creates a new property click record.
    """
    db_property_click = models.PropertyClick(
        property_id=property_id,
        clicked_at=datetime.utcnow(), # Ensure consistent timezone handling if needed, or let server_default handle it
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(db_property_click)
    db.commit()
    db.refresh(db_property_click)
    return db_property_click

# Optional: A function to get clicks for a property (example)
# def get_property_clicks(db: Session, property_id: int, skip: int = 0, limit: int = 100) -> list[models.PropertyClick]:
#     return db.query(models.PropertyClick).filter(models.PropertyClick.property_id == property_id).offset(skip).limit(limit).all() 