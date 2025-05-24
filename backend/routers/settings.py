import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG) # Ensure this logger also captures debug messages

logger.info("Loading settings router...")

try:
    from fastapi import APIRouter, Depends
    logger.info("Imported APIRouter, Depends from fastapi")
except ImportError as e:
    logger.error(f"Failed to import from fastapi: {e}")
    raise
try:
    from sqlalchemy.orm import Session
    logger.info("Imported Session from sqlalchemy.orm")
except ImportError as e:
    logger.error(f"Failed to import Session from sqlalchemy.orm: {e}")
    raise
try:
    from typing import Dict
    logger.info("Imported Dict from typing")
except ImportError as e:
    logger.error(f"Failed to import Dict from typing: {e}")
    raise

try:
    import schemas, models
    logger.info("Imported schemas, models")
except ImportError as e:
    logger.error(f"Failed to import schemas, models: {e}")
    raise
try:
    from core.database import get_db
    logger.info("Imported get_db from core.database")
except ImportError as e:
    logger.error(f"Failed to import get_db from core.database: {e}")
    raise
try:
    from crud import settings as crud_settings
    logger.info("Imported settings as crud_settings from crud")
except ImportError as e:
    logger.error(f"Failed to import crud_settings: {e}")
    raise
try:
    from auth import utils as auth_utils
    logger.info("Imported utils as auth_utils from auth")
except ImportError as e:
    logger.error(f"Failed to import auth_utils: {e}")
    raise

router = APIRouter()
logger.info("Settings router APIRouter initialized.")

@router.get("/", response_model=Dict[str, schemas.SiteSetting])
def get_all_settings(db: Session = Depends(get_db)):
    logger.debug("GET /api/settings/ called")
    try:
        settings_data = crud_settings.get_settings(db)
        logger.debug(f"Retrieved settings data: {settings_data}")
        return settings_data
    except Exception as e:
        logger.error(f"Error in get_all_settings: {e}", exc_info=True)
        raise

@router.put("/", response_model=Dict[str, schemas.SiteSetting])
def update_all_settings(settings_update: Dict[str, dict], db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"PUT /api/settings/ called with data: {settings_update}")
    try:
        updated_settings = crud_settings.bulk_update_settings(db, settings_update)
        logger.debug(f"Updated settings data: {updated_settings}")
        return updated_settings
    except Exception as e:
        logger.error(f"Error in update_all_settings: {e}", exc_info=True)
        raise

logger.info("Settings router loaded successfully.")