from sqlalchemy.orm import Session
from typing import Dict, Optional
from .. import models, schemas


def get_settings(db: Session) -> Dict[str, models.SiteSettings]:
    rows = db.query(models.SiteSettings).all()
    return {row.key: row for row in rows}


def upsert_setting(db: Session, key: str, value: dict, category: Optional[str] = "General") -> models.SiteSettings:
    db_obj = db.query(models.SiteSettings).filter(models.SiteSettings.key == key).first()
    if db_obj:
        db_obj.value = value
        db_obj.category = category
    else:
        db_obj = models.SiteSettings(key=key, value=value, category=category)
        db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def bulk_update_settings(db: Session, settings_update: Dict[str, dict]):
    for key, val in settings_update.items():
        upsert_setting(db, key, val.get("value"), val.get("category", "General"))
    return get_settings(db) 