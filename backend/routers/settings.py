from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from .. import schemas, models
from ..core.database import get_db
from ..crud import settings as crud_settings
from ..auth import utils as auth_utils

router = APIRouter()

@router.get("/", response_model=Dict[str, schemas.SiteSetting])
def get_all_settings(db: Session = Depends(get_db)):
    return crud_settings.get_settings(db)

@router.put("/", response_model=Dict[str, schemas.SiteSetting])
def update_all_settings(settings_update: Dict[str, dict], db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    return crud_settings.bulk_update_settings(db, settings_update) 