from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas

class CRUDContact:
    def create_contact(self, db: Session, contact_in: schemas.ContactCreate) -> models.Contact:
        db_obj = models.Contact(**contact_in.dict(exclude_unset=True))
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_contact(self, db: Session, contact_id: int) -> Optional[models.Contact]:
        return db.query(models.Contact).filter(models.Contact.id == contact_id).first()

    def get_contacts(self, db: Session, current_user: models.User, skip: int = 0, limit: int = 100) -> List[models.Contact]:
        query = db.query(models.Contact)
        if current_user.role == models.Role.staff:
            # Staff ONLY see contacts assigned to them
            query = query.filter(models.Contact.assigned_to_id == current_user.id)
        # Admins and Managers see all contacts (no additional filter based on assignment by default)
        # If a manager should only see their assignments or unassigned, that logic would be added here.
        return query.order_by(models.Contact.submitted_at.desc()).offset(skip).limit(limit).all()

    def update_contact(self, db: Session, db_contact: models.Contact, contact_update: schemas.ContactUpdate) -> models.Contact:
        update_data = contact_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "assigned_to_id":
                setattr(db_contact, field, value)
            else:
                setattr(db_contact, field, value)
        db.add(db_contact)
        db.commit()
        db.refresh(db_contact)
        return db_contact

contact = CRUDContact() 