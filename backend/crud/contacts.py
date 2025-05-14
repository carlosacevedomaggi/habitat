from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas


def create_contact(db: Session, contact_in: schemas.ContactCreate) -> models.Contact:
    db_obj = models.Contact(**contact_in.dict(exclude_unset=True))
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_contact(db: Session, contact_id: int) -> Optional[models.Contact]:
    return db.query(models.Contact).filter(models.Contact.id == contact_id).first()


def get_contacts(db: Session, skip: int = 0, limit: int = 100) -> List[models.Contact]:
    return db.query(models.Contact).order_by(models.Contact.submitted_at.desc()).offset(skip).limit(limit).all()


def update_contact(db: Session, db_contact: models.Contact, contact_update: schemas.ContactUpdate) -> models.Contact:
    update_data = contact_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contact, field, value)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact 