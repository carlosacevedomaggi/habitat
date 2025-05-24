from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas


def get_team_member(db: Session, member_id: int) -> Optional[models.TeamMember]:
    return db.query(models.TeamMember).filter(models.TeamMember.id == member_id).first()


def get_team_members(db: Session, skip: int = 0, limit: int = 100) -> List[models.TeamMember]:
    return db.query(models.TeamMember).order_by(models.TeamMember.order).offset(skip).limit(limit).all()


def create_team_member(db: Session, member_in: schemas.TeamMemberCreate) -> models.TeamMember:
    data = member_in.dict(exclude_unset=True)
    if 'image_url' in data and data['image_url'] is not None:
        data['image_url'] = str(data['image_url'])
    db_member = models.TeamMember(**data)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def update_team_member(db: Session, db_member: models.TeamMember, member_update: schemas.TeamMemberUpdate) -> models.TeamMember:
    update_data = member_update.dict(exclude_unset=True)
    if 'image_url' in update_data and update_data['image_url'] is not None:
        update_data['image_url'] = str(update_data['image_url'])
    for field, value in update_data.items():
        setattr(db_member, field, value)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def delete_team_member(db: Session, db_member: models.TeamMember):
    db.delete(db_member)
    db.commit() 