import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

logger.info("Loading properties router...")

try:
    from fastapi import APIRouter, Depends, HTTPException, status, Request
    logger.info("Imported from fastapi")
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
    from typing import List, Optional
    logger.info("Imported List, Optional from typing")
except ImportError as e:
    logger.error(f"Failed to import List, Optional from typing: {e}")
    raise
try:
    from core.database import get_db
    logger.info("Imported get_db from core.database")
except ImportError as e:
    logger.error(f"Failed to import get_db from core.database: {e}")
    raise
try:
    import schemas, models
    logger.info("Imported schemas, models")
except ImportError as e:
    logger.error(f"Failed to import schemas, models: {e}")
    raise
try:
    from crud import property as crud_property
    logger.info("Imported property as crud_property from crud")
except ImportError as e:
    logger.error(f"Failed to import crud_property: {e}")
    raise
try:
    from crud.property_clicks import create_property_click
    logger.info("Imported create_property_click from crud.property_clicks")
except ImportError as e:
    logger.error(f"Failed to import create_property_click: {e}")
    raise
try:
    from auth import utils as auth_utils
    logger.info("Imported utils as auth_utils from auth")
except ImportError as e:
    logger.error(f"Failed to import auth_utils: {e}")
    raise
try:
    from jose import jwt, JWTError
    logger.info("Imported jwt, JWTError from jose")
except ImportError as e:
    logger.error(f"Failed to import from jose: {e}")
    raise
try:
    from core.config import settings
    logger.info("Imported settings from core.config")
except ImportError as e:
    logger.error(f"Failed to import settings from core.config: {e}")
    raise
try:
    from crud import user as crud_user
    logger.info("Imported user as crud_user from crud")
except ImportError as e:
    logger.error(f"Failed to import crud_user: {e}")
    raise

# Import models, schemas, crud functions, and db session dependency
# from .. import models, schemas, crud
# from ..core.database import get_db
# from ..auth import get_current_active_user # For protected routes

router = APIRouter()
logger.info("Properties router APIRouter initialized.")

# Current user dependency (JWT)
# get_current_active_user = auth_utils.get_current_active_user

# Let's create a dependency that tries to get a user, but doesn't fail if no token
def get_optional_current_user(db: Session = Depends(get_db), token: Optional[str] = Depends(auth_utils.oauth2_scheme, use_cache=False)) -> Optional[models.User]:
    logger.debug(f"get_optional_current_user called. Token present: {bool(token)}")
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username: str = payload.get("sub")
            logger.debug(f"Token decoded. Username: {username}")
            if username is None:
                logger.warn("No username (sub) in token payload.")
                return None # No username in token
            user = crud_user.get_user_by_username(db, username)
            logger.debug(f"User found by username: {user.username if user else 'None'}")
            return user
        except JWTError as e:
            logger.warn(f"JWTError decoding token: {e}")
            return None # Token error
        except Exception as e:
            logger.error(f"Unexpected error in get_optional_current_user: {e}", exc_info=True)
            return None
    return None

@router.get("/", response_model=List[schemas.Property]) # Replace PropertySchema with actual schemas.Property
def read_properties(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    property_type: Optional[str] = None,
    listing_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    max_bedrooms: Optional[int] = None,
    min_bathrooms: Optional[int] = None,
    max_bathrooms: Optional[int] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user) # Use optional user
):
    logger.debug(f"GET /api/properties/ called with params: skip={skip}, limit={limit}, search='{search}', ...")
    try:
        properties = crud_property.get_properties(
            db, skip=skip, limit=limit, search=search, property_type=property_type,
            listing_type=listing_type, min_price=min_price, max_price=max_price,
            min_bedrooms=min_bedrooms, max_bedrooms=max_bedrooms,
            min_bathrooms=min_bathrooms, max_bathrooms=max_bathrooms,
            min_area=min_area, max_area=max_area, current_user=current_user # Pass current_user
        )
        logger.debug(f"Retrieved {len(properties)} properties.")
        return properties
    except Exception as e:
        logger.error(f"Error in read_properties: {e}", exc_info=True)
        raise

@router.get("/{property_id}/", response_model=schemas.Property) # Replace PropertySchema
def read_property(property_id: int, db: Session = Depends(get_db)):
    logger.debug(f"GET /api/properties/{property_id} called.")
    try:
        db_property = crud_property.get_property(db, property_id=property_id)
        if db_property is None:
            logger.warn(f"Property with id {property_id} not found.")
            raise HTTPException(status_code=404, detail="Property not found")
        logger.debug(f"Retrieved property: {db_property.title}")
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in read_property for id {property_id}: {e}", exc_info=True)
        raise

@router.post("/", response_model=schemas.Property, status_code=status.HTTP_201_CREATED)
def create_property(
    property_in: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.require_manager) # Keep require_manager for creation authorization
):
    logger.debug(f"POST /api/properties/ called by user {current_user.username} with data: {property_in.title}")
    try:
        new_property = crud_property.create_property(db=db, property_in=property_in, current_user=current_user)
        logger.info(f"Property '{new_property.title}' created with id {new_property.id}.")
        return new_property
    except Exception as e:
        logger.error(f"Error in create_property: {e}", exc_info=True)
        raise

@router.put("/{property_id}/", response_model=schemas.Property)
def update_property(
    property_id: int,
    property_update: schemas.PropertyUpdate, # Replace PropertySchema with schemas.PropertyUpdate
    db: Session = Depends(get_db),
    current_user = Depends(auth_utils.require_manager)
):
    logger.debug(f"PUT /api/properties/{property_id} called by user {current_user.username} with update: {property_update.dict(exclude_unset=True)}")
    try:
        db_prop = crud_property.get_property(db, property_id)
        if not db_prop:
            logger.warn(f"Property with id {property_id} not found for update.")
            raise HTTPException(status_code=404, detail="Property not found")
        updated = crud_property.update_property(db, db_prop, property_update)
        logger.info(f"Property id {property_id} updated.")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_property for id {property_id}: {e}", exc_info=True)
        raise

@router.delete("/{property_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth_utils.require_manager)
):
    logger.debug(f"DELETE /api/properties/{property_id} called by user {current_user.username}")
    try:
        db_prop = crud_property.get_property(db, property_id)
        if not db_prop:
            logger.warn(f"Property with id {property_id} not found for deletion.")
            raise HTTPException(status_code=404, detail="Property not found")
        crud_property.delete_property(db, db_prop)
        logger.info(f"Property id {property_id} deleted.")
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_property for id {property_id}: {e}", exc_info=True)
        raise

@router.post("/{property_id}/track-click/", response_model=schemas.PropertyClick, status_code=status.HTTP_201_CREATED)
def track_property_click(
    property_id: int,
    request: Request, # Inject Request object
    db: Session = Depends(get_db)
):
    logger.debug(f"POST /api/properties/{property_id}/track-click called.")
    try:
        db_property = crud_property.get_property(db, property_id=property_id)
        if not db_property:
            logger.warn(f"Property with id {property_id} not found for click tracking.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        
        client_host = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        logger.debug(f"Tracking click for property {property_id}. IP: {client_host}, UA: {user_agent}")

        click = create_property_click(
            db=db,
            property_id=property_id,
            ip_address=client_host,
            user_agent=user_agent
        )
        logger.info(f"Click tracked for property {property_id}, click ID: {click.id}")
        return click
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in track_property_click for property id {property_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not record property click")


# Note: Ensure existing endpoints like create_property and update_property are correctly using
# current_user for created_by_user_id and assigned_to_id logic as per previous phases.
# Example for create_property if it needs adjustment:
# @router.post("/", response_model=schemas.Property, status_code=status.HTTP_201_CREATED)
# def create_property_endpoint(
#     property_in: schemas.PropertyCreate,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(require_manager) # or other appropriate dependency
# ):
#     return crud.property.create_property(db=db, property_in=property_in, current_user=current_user)
logger.info("Properties router loaded successfully.")