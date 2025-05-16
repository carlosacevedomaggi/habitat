from sqlalchemy.orm import Session
from typing import Dict, Optional, Any
from .. import models, schemas

class CRUDSiteSetting:
    def get_settings(self, db: Session) -> Dict[str, models.SiteSettings]: # Changed to models.SiteSetting, assuming SiteSettings is the model
        rows = db.query(models.SiteSettings).all() # Changed to models.SiteSetting
        # The return type Dict[str, models.SiteSetting] implies that the key is a string 
        # and the value is the SiteSetting model instance.
        # If you want to return the schema, it would be Dict[str, schemas.SiteSetting]
        # For now, sticking to what the original function returned (model instances, keyed by their 'key' attribute)
        return {row.key: row for row in rows}

    def upsert_setting(self, db: Session, key: str, value: Any, category: Optional[str] = "General") -> models.SiteSettings:
        db_obj = db.query(models.SiteSettings).filter(models.SiteSettings.key == key).first()
        if db_obj:
            db_obj.value = value # value here is directly the Any type from input
            db_obj.category = category
        else:
            db_obj = models.SiteSettings(key=key, value=value, category=category)
            db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def bulk_update_settings(self, db: Session, settings_update: Dict[str, Any]): # Changed settings_update value to Any
        # The input `settings_update` is Dict[str, Any] where Any is expected to be
        # like `{"value": ..., "category": ...}` based on original code.
        for key, val_dict in settings_update.items():
            if isinstance(val_dict, dict):
                value = val_dict.get("value")
                category = val_dict.get("category", "General")
                self.upsert_setting(db, key, value, category)
            else:
                # Handle cases where val_dict might not be a dict, or log an error/warning
                # For now, assuming it will always be a dict as per original structure
                self.upsert_setting(db, key, val_dict) # Fallback if not a dict, though likely an issue
        return self.get_settings(db)

site_setting = CRUDSiteSetting() 