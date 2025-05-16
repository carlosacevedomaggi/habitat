from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from .. import schemas, models
from ..crud import property as crud_property
from ..crud.property_clicks import create_property_click
from ..auth import utils as auth_utils  # provides role requirements
from jose import jwt, JWTError
from ..core.config import settings
from ..crud import user as crud_user

# Import models, schemas, crud functions, and db session dependency
# from .. import models, schemas, crud
# from ..core.database import get_db
# from ..auth import get_current_active_user # For protected routes

router = APIRouter()

# Current user dependency (JWT)
# get_current_active_user = auth_utils.get_current_active_user

# Let's create a dependency that tries to get a user, but doesn't fail if no token
def get_optional_current_user(db: Session = Depends(get_db), token: Optional[str] = Depends(auth_utils.oauth2_scheme, use_cache=False)) -> Optional[models.User]:
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None # No username in token
            user = crud_user.get_user_by_username(db, username)
            return user
        except JWTError:
            return None # Token error
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
    """Retrieve properties with pagination and filtering."""
    properties = crud_property.get_properties(
        db, skip=skip, limit=limit, search=search, property_type=property_type,
        listing_type=listing_type, min_price=min_price, max_price=max_price,
        min_bedrooms=min_bedrooms, max_bedrooms=max_bedrooms,
        min_bathrooms=min_bathrooms, max_bathrooms=max_bathrooms,
        min_area=min_area, max_area=max_area, current_user=current_user # Pass current_user
    )
    return properties

@router.get("/{property_id}", response_model=schemas.Property) # Replace PropertySchema
def read_property(property_id: int, db: Session = Depends(get_db)):
    """Retrieve a single property by ID."""
    db_property = crud_property.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.post("/", response_model=schemas.Property, status_code=status.HTTP_201_CREATED)
def create_property(
    property_in: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.require_manager) # Keep require_manager for creation authorization
):
    """Create a new property (Manager+)."""
    return crud_property.create_property(db=db, property_in=property_in, current_user=current_user)

@router.put("/{property_id}", response_model=schemas.Property)
def update_property(
    property_id: int, 
    property_update: schemas.PropertyUpdate, # Replace PropertySchema with schemas.PropertyUpdate
    db: Session = Depends(get_db),
    current_user = Depends(auth_utils.require_manager)
):
    """Update an existing property (Manager+)."""
    db_prop = crud_property.get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    updated = crud_property.update_property(db, db_prop, property_update)
    return updated

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(auth_utils.require_manager)
):
    """Delete a property (Manager+)."""
    db_prop = crud_property.get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    crud_property.delete_property(db, db_prop)
    return 

@router.post("/{property_id}/track-click", response_model=schemas.PropertyClick, status_code=status.HTTP_201_CREATED)
def track_property_click(
    property_id: int,
    request: Request, # Inject Request object
    db: Session = Depends(get_db)
):
    """
    Records a click/view for a specific property.
    This endpoint is intended to be called from the public-facing property detail page.
    It captures the client's IP address and User-Agent.
    """
    db_property = crud_property.get_property(db, property_id=property_id)
    if not db_property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    client_host = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Use the new CRUD function for property clicks
    try:
        click = create_property_click(
            db=db, 
            property_id=property_id, 
            ip_address=client_host, 
            user_agent=user_agent
        )
        return click
    except Exception as e:
        # Log the exception e if you have logging setup
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