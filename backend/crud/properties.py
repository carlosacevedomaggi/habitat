from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from sqlalchemy.sql import func
import logging
logger = logging.getLogger(__name__)

# ---------- Property CRUD ----------

class CRUDProperty:
    def get_properties(
        self, db: Session,
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
        current_user: Optional[models.User] = None
    ) -> List[models.Property]:
        log_call_details = (
            f"get_properties called with skip={skip}, limit={limit}, search='{search}', "
            f"property_type='{property_type}', listing_type='{listing_type}', "
            f"min_price={min_price}, max_price={max_price}, "
            f"min_bedrooms={min_bedrooms}, max_bedrooms={max_bedrooms}, "
            f"min_bathrooms={min_bathrooms}, max_bathrooms={max_bathrooms}, "
            f"min_area={min_area}, max_area={max_area}"
        )
        logger.info(log_call_details)
        
        user_info = "Public user (Unauthenticated)"
        if current_user:
            user_info = f"User '{current_user.username}' (Role: {current_user.role.value if current_user.role else 'N/A'})"
        logger.info(f"Request context: {user_info}")

        query = db.query(models.Property)

        if current_user:
            if current_user.role == models.Role.staff:
                logger.info(f"Applying filter for staff user {current_user.username}: only assigned_to_id == {current_user.id}")
                query = query.filter(models.Property.assigned_to_id == current_user.id)
            # Potentially other role-based filters for authenticated users could go here
            # else:
            #     # For admin/manager, perhaps show all, or all non-draft?
            #     # For now, if not staff, no additional user-based filters are applied beyond public visibility rules
            #     logger.info(f"User {current_user.username} (Role: {current_user.role.value}) - no specific user-based query adjustments other than general filters.")
                
        # Standard filters applicable to all (public and authenticated)
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
            query = query.filter(models.Property.square_feet >= min_area)
        if max_area is not None:
            query = query.filter(models.Property.square_feet <= max_area)

        properties_returned = query.offset(skip).limit(limit).all()
        
        logger.info(f"{user_info} - Query resulted in {len(properties_returned)} properties being returned (after offset/limit):")
        if not properties_returned:
            logger.info("  No properties matched the criteria.")
        for prop in properties_returned:
            logger.info(
                f"  - ID: {prop.id}, Title: '{prop.title}', Status: '{prop.status}', "
                f"Price: {prop.price}, Bedrooms: {prop.bedrooms}, Location: '{prop.location}', "
                f"Assigned_to_id: {prop.assigned_to_id}, Created_by_user_id: {prop.created_by_user_id}, "
                f"Is_Featured: {prop.is_featured}"
            )
            
        return properties_returned

    def get_property(self, db: Session, property_id: int) -> Optional[models.Property]:
        return db.query(models.Property).filter(models.Property.id == property_id).first()

    def create_property(self, db: Session, property_in: schemas.PropertyCreate, current_user: models.User) -> models.Property:
        property_data = property_in.dict(exclude_unset=True, exclude={'additional_image_urls', 'assigned_to_id', 'created_by_user_id'})
        
        if 'image_url' in property_data and property_data['image_url'] is not None:
            property_data['image_url'] = str(property_data['image_url'])

        new_prop = models.Property(**property_data)
        new_prop.created_by_user_id = current_user.id

        if current_user.role == models.Role.staff:
            new_prop.assigned_to_id = current_user.id
        elif property_in.assigned_to_id is not None:
            new_prop.assigned_to_id = property_in.assigned_to_id
        
        db.add(new_prop)
        db.flush()

        if property_in.additional_image_urls:
            for order_idx, image_url in enumerate(property_in.additional_image_urls):
                prop_image = models.PropertyImage(
                    property_id=new_prop.id,
                    image_url=str(image_url),
                    order=order_idx
                )
                db.add(prop_image)
        
        db.commit()
        db.refresh(new_prop)
        return new_prop

    def update_property(self, db: Session, db_prop: models.Property, property_update: schemas.PropertyUpdate) -> models.Property:
        if property_update.delete_image_ids:
            images_to_delete = db.query(models.PropertyImage).filter(
                models.PropertyImage.property_id == db_prop.id,
                models.PropertyImage.id.in_(property_update.delete_image_ids)
            ).all()
            for image in images_to_delete:
                db.delete(image)

        if property_update.additional_image_urls:
            max_order = db.query(func.max(models.PropertyImage.order)).filter(models.PropertyImage.property_id == db_prop.id).scalar()
            current_max_order = max_order if max_order is not None else -1
            
            for order_idx, image_url in enumerate(property_update.additional_image_urls):
                prop_image = models.PropertyImage(
                    property_id=db_prop.id,
                    image_url=str(image_url),
                    order=current_max_order + 1 + order_idx
                )
                db.add(prop_image)

        update_data = property_update.dict(exclude_unset=True, exclude={'additional_image_urls', 'delete_image_ids'})
        
        if 'image_url' in update_data and update_data['image_url'] is not None:
            update_data['image_url'] = str(update_data['image_url'])
        
        if 'assigned_to_id' in update_data:
            setattr(db_prop, 'assigned_to_id', update_data.pop('assigned_to_id'))
            
        for field, value in update_data.items():
            setattr(db_prop, field, value)
        
        db.add(db_prop)
        db.commit()
        db.refresh(db_prop)
        return db_prop

    def delete_property(self, db: Session, db_prop: models.Property):
        db.delete(db_prop)
        db.commit()

property = CRUDProperty() 