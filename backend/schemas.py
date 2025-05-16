from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum

# Schemas define the shape of data for API requests and responses

# ------------- Property Schemas ------------- 

class PropertyImageBase(BaseModel):
    image_url: HttpUrl
    order: Optional[int] = 0

class PropertyImageCreate(PropertyImageBase):
    pass # Typically used if creation needs different fields than base, e.g. property_id passed separately

class PropertyImage(PropertyImageBase):
    id: int
    property_id: int

    class Config:
        orm_mode = True

class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None # e.g., "Venta de propiedad", "Renta"
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    image_url: Optional[HttpUrl] = None # Main image URL
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_featured: Optional[bool] = False

class PropertyCreate(PropertyBase):
    # Field for new additional images, URLs will be provided after upload
    additional_image_urls: Optional[List[HttpUrl]] = None 

class PropertyUpdate(PropertyBase):
    title: Optional[str] = None 
    # All fields from PropertyBase are implicitly optional because it's for updates (PATCH-like)
    # New additional images to be added
    additional_image_urls: Optional[List[HttpUrl]] = None 
    # IDs of existing PropertyImage records to be deleted
    delete_image_ids: Optional[List[int]] = None
    # Optional: Field to update order of existing images
    # image_order: Optional[List[dict]] = None # e.g., [{ "id": 1, "order": 0 }, { "id": 2, "order": 1 }]

class Property(PropertyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    images: List[PropertyImage] = [] # Include related images (PropertyImage schema)

    class Config:
        orm_mode = True

# ------------- Role Enum -------------

class Role(str, Enum):
    admin = "admin"
    manager = "manager"
    staff = "staff"

# ------------- User Schemas (Role-based) -------------

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: Optional[Role] = Role.staff

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

# ------------- Auth Schemas ------------- 

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# ------------- Site Settings Schemas ------------- 

class SiteSettingBase(BaseModel):
    key: str
    value: Any
    category: Optional[str] = 'General'

class SiteSettingCreate(SiteSettingBase):
    pass

class SiteSettingUpdate(BaseModel):
    value: Optional[dict] = None
    category: Optional[str] = None

class SiteSetting(SiteSettingBase):
    class Config:
        from_attributes = True

# ------------- Team Member Schemas ------------- 

class TeamMemberBase(BaseModel):
    name: str
    position: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    order: Optional[int] = 0

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    order: Optional[int] = None

class TeamMember(TeamMemberBase):
    id: int
    class Config:
        orm_mode = True

# ------------- Contact Schemas ------------- 

class ContactBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    property_id: Optional[int] = None
    assigned_to_id: Optional[int] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    is_read: Optional[bool] = None

class Contact(ContactBase):
    id: int
    submitted_at: datetime
    is_read: bool
    assigned_to: Optional[User] = None # To hold the related User object
    class Config:
        orm_mode = True

# ------------- Upload Schemas ------------- 

class UploadResponse(BaseModel):
    filename: str
    url: HttpUrl 