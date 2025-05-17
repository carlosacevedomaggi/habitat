from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings  # settings needed early

# Assuming routers are defined in the ./routers directory
# from .routers import properties, users, settings, team, contact, uploads
# from .core.database import engine # If using SQLAlchemy
# from . import models # If using SQLAlchemy models

# Uncomment the below line if using SQLAlchemy and Alembic migrations
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Habitat API",
    description="API for the Habitat Real Estate Application",
    version="0.1.0"
)

# Base origins from settings (.env) or defaults
origins = settings.BACKEND_CORS_ORIGINS.copy() if isinstance(settings.BACKEND_CORS_ORIGINS, list) else list(settings.BACKEND_CORS_ORIGINS)

# Ensure common local dev ports are allowed (3000 and 3001)
for port in ("http://localhost:3000", "http://localhost:3001"):
    if port not in origins:
        origins.append(port)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Habitat API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Include routers from the routers directory
from .routers import properties, users, team, settings as settings_router, contact, uploads

app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(team.router, prefix="/api/team", tags=["team"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])

# Add logic for serving static files if backend handles uploads directly
from fastapi.staticfiles import StaticFiles
import os

# The UPLOAD_DIR is 'backend/static/uploads'. We need to serve the 'backend/static' directory.
# os.path.dirname(settings.UPLOAD_DIR) will give 'backend/static'
static_files_directory = os.path.dirname(settings.UPLOAD_DIR)

# Ensure the static directory itself exists, though UPLOAD_DIR creation already implies its parent exists.
# os.makedirs(static_files_directory, exist_ok=True) # This line is actually not needed if UPLOAD_DIR is within static_files_directory

app.mount("/static", StaticFiles(directory=static_files_directory), name="static") 