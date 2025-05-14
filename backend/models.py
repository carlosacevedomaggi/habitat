from sqlalchemy import (Boolean, Column, Integer, String, Text, Float, DateTime, 
                          ForeignKey, JSON)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

# Using declarative_base() from SQLAlchemy
Base = declarative_base()

class SiteSettings(Base):
    __tablename__ = "site_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(JSON) # Store complex settings like colors, fonts as JSON
    category = Column(String, index=True, default='General') # e.g., General, Contact, Theme, SEO

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_editor = Column(Boolean, default=True)
    # Add fields like created_at, updated_at if needed
    # created_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Float)
    location = Column(String)
    property_type = Column(String) # Consider Enum or relationship if types are fixed
    listing_type = Column(String) # "Venta", "Renta"
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area = Column(Float, nullable=True)
    image_url = Column(String, nullable=True) # Main image URL
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    images = relationship("PropertyImage", back_populates="property")

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

    # Add relationship back to property if needed
    # property = relationship("Property")

# Note: This structure is based on the migration plan.
# You might need to adjust data types (e.g., use Numeric for price) 
# and add constraints based on requirements.
# Consider using Alembic for database migrations. 