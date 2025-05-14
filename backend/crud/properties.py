from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from sqlalchemy.sql import func

# ---------- Property CRUD ----------

def get_properties(
    db: Session,
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
) -> List[models.Property]:
    query = db.query(models.Property)

    if search:
        ilike = f"%{search}%"
        query = query.filter(models.Property.title.ilike(ilike) | models.Property.location.ilike(ilike))
    if property_type:
        query = query.filter(models.Property.property_type == property_type)
    if listing_type:
        query = query.filter(models.Property.listing_type == listing_type)
    if min_price is not None:
        query = query.filter(models.Property.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Property.price <= max_price)
    if min_bedrooms is not None:
        query = query.filter(models.Property.bedrooms >= min_bedrooms)
    if max_bedrooms is not None:
        query = query.filter(models.Property.bedrooms <= max_bedrooms)
    if min_bathrooms is not None:
        query = query.filter(models.Property.bathrooms >= min_bathrooms)
    if max_bathrooms is not None:
        query = query.filter(models.Property.bathrooms <= max_bathrooms)
    if min_area is not None:
        query = query.filter(models.Property.area >= min_area)
    if max_area is not None:
        query = query.filter(models.Property.area <= max_area)

    return query.offset(skip).limit(limit).all()


def get_property(db: Session, property_id: int) -> Optional[models.Property]:
    return db.query(models.Property).filter(models.Property.id == property_id).first()


def create_property(db: Session, property_in: schemas.PropertyCreate) -> models.Property:
    property_data = property_in.dict(exclude_unset=True, exclude={'additional_image_urls'})
    # Ensure image_url is a plain string for database compatibility (SQLite cannot bind HttpUrl)
    if 'image_url' in property_data and property_data['image_url'] is not None:
        property_data['image_url'] = str(property_data['image_url'])
    new_prop = models.Property(**property_data)
    db.add(new_prop)
    db.flush() # Flush to get the new_prop.id

    if property_in.additional_image_urls:
        for order_idx, image_url in enumerate(property_in.additional_image_urls):
            prop_image = models.PropertyImage(
                property_id=new_prop.id,
                image_url=str(image_url), # Ensure it's a string
                order=order_idx
            )
            db.add(prop_image)
    
    db.commit()
    db.refresh(new_prop)
    return new_prop


def update_property(db: Session, db_prop: models.Property, property_update: schemas.PropertyUpdate) -> models.Property:
    # Handle deletion of existing images
    if property_update.delete_image_ids:
        images_to_delete = db.query(models.PropertyImage).filter(
            models.PropertyImage.property_id == db_prop.id,
            models.PropertyImage.id.in_(property_update.delete_image_ids)
        ).all()
        for image in images_to_delete:
            # TODO: Consider deleting the actual file from storage here
            db.delete(image)

    # Handle adding new additional images
    if property_update.additional_image_urls:
        # Determine starting order for new images
        max_order = db.query(func.max(models.PropertyImage.order)).filter(models.PropertyImage.property_id == db_prop.id).scalar()
        current_max_order = max_order if max_order is not None else -1
        
        for order_idx, image_url in enumerate(property_update.additional_image_urls):
            prop_image = models.PropertyImage(
                property_id=db_prop.id,
                image_url=str(image_url),
                order=current_max_order + 1 + order_idx
            )
            db.add(prop_image)

    # Update main property fields
    update_data = property_update.dict(exclude_unset=True, exclude={'additional_image_urls', 'delete_image_ids'})
    # Cast potential HttpUrl to string
    if 'image_url' in update_data and update_data['image_url'] is not None:
        update_data['image_url'] = str(update_data['image_url'])
    for field, value in update_data.items():
        setattr(db_prop, field, value)
    
    db.add(db_prop) # Add to session, even if only related objects changed, or fields on db_prop itself
    db.commit()
    db.refresh(db_prop)
    return db_prop


def delete_property(db: Session, db_prop: models.Property):
    # PropertyImages are set with cascade='all, delete-orphan', 
    # so they should be deleted automatically when the property is deleted.
    # If not, manual deletion would be needed here:
    # db.query(models.PropertyImage).filter(models.PropertyImage.property_id == db_prop.id).delete()
    db.delete(db_prop)
    db.commit() 