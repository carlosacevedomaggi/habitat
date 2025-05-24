from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from auth import utils as auth_utils
from models import Role

class CRUDUser:
    def get_user(self, db: Session, user_id: int) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.id == user_id).first()

    def get_user_by_username(self, db: Session, username: str) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.username == username).first()

    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
        return db.query(models.User).offset(skip).limit(limit).all()

    def create_user(self, db: Session, user_in: schemas.UserCreate) -> models.User:
        hashed_password = auth_utils.get_password_hash(user_in.password)
        db_user = models.User(
            username=user_in.username,
            email=user_in.email,
            password_hash=hashed_password,
            role=user_in.role if user_in.role is not None else Role.staff,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def update_user(self, db: Session, db_user: models.User, user_update: schemas.UserUpdate) -> models.User:
        update_data = user_update.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["password_hash"] = auth_utils.get_password_hash(update_data.pop("password"))
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def delete_user(self, db: Session, db_user: models.User):
        db.delete(db_user)
        db.commit()

user = CRUDUser() 