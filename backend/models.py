from sqlalchemy import (Boolean, Column, Integer, String, Text, Float, DateTime, 
                          ForeignKey, JSON, Enum)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum

# Using declarative_base() from SQLAlchemy
Base = declarative_base()

class SiteSettings(Base):
    __tablename__ = "site_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(JSON) # Store complex settings like colors, fonts as JSON
    category = Column(String, index=True, default='General') # e.g., General, Contact, Theme, SEO

class Role(enum.Enum):
    admin = "admin"
    manager = "manager"
    staff = "staff"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.staff, nullable=False)
    # Add fields like created_at, updated_at if needed
    # created_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to properties owned by this user
    properties = relationship("Property", foreign_keys="[Property.owner_id]", back_populates="owner")
    # If user can be assigned to contacts
    assigned_contacts = relationship("Contact", foreign_keys="[Contact.assigned_to_id]", back_populates="assigned_to")
    # If user can be assigned to properties
    assigned_properties = relationship("Property", foreign_keys="[Property.assigned_to_id]", back_populates="assigned_to")
    # Properties created by this user
    created_properties = relationship("Property", foreign_keys="[Property.created_by_user_id]", back_populates="created_by")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    location = Column(String)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    square_feet = Column(Integer)
    property_type = Column(String)  # e.g., 'House', 'Apartment', 'Condo'
    listing_type = Column(String, nullable=True)
    status = Column(String, default="available")  # e.g., 'available', 'sold', 'pending'
    image_url = Column(String, nullable=True) 
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Retaining for now, though may be superseded by created_by
    owner = relationship("User", foreign_keys=[owner_id], back_populates="properties")

    # New fields for assignment and creator tracking
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_properties")

    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_properties")

    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
    clicks = relationship("PropertyClick", back_populates="property") # Relationship to PropertyClick

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    image_url = Column(String, nullable=False)
    order = Column(Integer, default=0) # For ordering images in a gallery

    property = relationship("Property", back_populates="images")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    position = Column(String)
    image_url = Column(String, nullable=True)
    order = Column(Integer, default=0)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True) # Link to specific property if applicable
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_contacts")
    # Add relationship back to property if needed
    # property = relationship("Property")

# Note: This structure is based on the migration plan.
# You might need to adjust data types (e.g., use Numeric for price) 
# and add constraints based on requirements.
# Consider using Alembic for database migrations. 

# New Model for Property Clicks
class PropertyClick(Base):
    __tablename__ = "property_clicks"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    # We could add a user_id if we want to track clicks by logged-in users specifically
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    property = relationship("Property", back_populates="clicks")
    # user = relationship("User") # If user_id is added

# If you have a different base or metadata object, ensure this model uses it.
# For example, if you are using Base = declarative_base() from a different file. 