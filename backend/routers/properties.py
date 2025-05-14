from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from .. import schemas, models
from ..crud import properties as crud_property
from ..auth import utils as auth_utils  # placeholder for current user; to be implemented

# Import models, schemas, crud functions, and db session dependency
# from .. import models, schemas, crud
# from ..core.database import get_db
# from ..auth import get_current_active_user # For protected routes

router = APIRouter()

# Current user dependency (JWT)
get_current_active_user = auth_utils.get_current_active_user

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
    db: Session = Depends(get_db)
):
    """Retrieve properties with pagination and filtering."""
    properties = crud_property.get_properties(
        db, skip=skip, limit=limit, search=search, property_type=property_type,
        listing_type=listing_type, min_price=min_price, max_price=max_price,
        min_bedrooms=min_bedrooms, max_bedrooms=max_bedrooms,
        min_bathrooms=min_bathrooms, max_bathrooms=max_bathrooms,
        min_area=min_area, max_area=max_area
    )
    return properties

@router.get("/{property_id}", response_model=schemas.Property) # Replace PropertySchema
def read_property(property_id: int, db: Session = Depends(get_db)):
    """Retrieve a single property by ID."""
    db_property = crud_property.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.post("/", response_model=schemas.Property, status_code=status.HTTP_201_CREATED) # Replace PropertySchema
def create_property(
    property_in: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user) # Protect route
):
    """Create a new property (Protected)."""
    # Add authorization check if needed (e.g., only admins/editors)
    # if not current_user.is_admin and not current_user.is_editor:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return crud_property.create_property(db=db, property_in=property_in)

@router.put("/{property_id}", response_model=schemas.Property) # Replace PropertySchema
def update_property(
    property_id: int, 
    property_update: schemas.PropertyUpdate, # Replace PropertySchema with schemas.PropertyUpdate
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user) # Protect route
):
    """Update an existing property (Protected)."""
    db_prop = crud_property.get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    updated = crud_property.update_property(db, db_prop, property_update)
    return updated

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user) # Protect route
):
    """Delete a property (Protected)."""
    # Authorization check (e.g., only admins)
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db_prop = crud_property.get_property(db, property_id)
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
    crud_property.delete_property(db, db_prop)
    return 