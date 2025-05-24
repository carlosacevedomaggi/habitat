import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

logger.info("Starting main.py imports...")

try:
    from fastapi import FastAPI
    logger.info("Imported FastAPI")
except ImportError as e:
    logger.error(f"Failed to import FastAPI: {e}")
    raise
try:
    from fastapi.middleware.cors import CORSMiddleware
    logger.info("Imported CORSMiddleware")
except ImportError as e:
    logger.error(f"Failed to import CORSMiddleware: {e}")
    raise
try:
    from core.config import settings  # settings needed early
    logger.info("Imported settings from core.config")
except ImportError as e:
    logger.error(f"Failed to import settings from core.config: {e}")
    raise

# Assuming routers are defined in the ./routers directory
# from .routers import properties, users, settings, team, contact, uploads
# from .core.database import engine # If using SQLAlchemy
# from . import models # If using SQLAlchemy models

# Uncomment the below line if using SQLAlchemy and Alembic migrations
# models.Base.metadata.create_all(bind=engine)

logger.info("Initializing FastAPI app...")
app = FastAPI(
    title="Habitat API",
    description="API for the Habitat Real Estate Application",
    version="0.1.0"
)
logger.info("FastAPI app initialized.")

# Base origins from settings (.env) or defaults
origins = settings.BACKEND_CORS_ORIGINS.copy() if isinstance(settings.BACKEND_CORS_ORIGINS, list) else list(settings.BACKEND_CORS_ORIGINS)
logger.debug(f"Initial CORS origins: {origins}")

# Ensure common local dev ports are allowed (3000 and 3001)
for port in ("http://localhost:3000", "http://localhost:3001"):
    if port not in origins:
        origins.append(port)
logger.debug(f"Updated CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware added.")

@app.get("/")
def read_root():
    logger.debug("Root endpoint / called")
    return {"message": "Welcome to the Habitat API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint /health called")
    return {"status": "ok"}

# Include routers from the routers directory
logger.info("Importing routers...")
try:
    from routers import properties, users, team, settings as settings_router, contact, uploads
    logger.info("Imported all routers")
except ImportError as e:
    logger.error(f"Failed to import routers: {e}")
    raise

logger.info("Including routers...")
app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
logger.debug("Included properties router.")
app.include_router(users.router, prefix="/api/users", tags=["users"])
logger.debug("Included users router.")
app.include_router(team.router, prefix="/api/team", tags=["team"])
logger.debug("Included team router.")
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
logger.debug("Included settings_router.")
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
logger.debug("Included contact router.")
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
logger.debug("Included uploads router.")
logger.info("All routers included.")

# Add logic for serving static files if backend handles uploads directly
logger.info("Setting up static files...")
try:
    from fastapi.staticfiles import StaticFiles
    logger.info("Imported StaticFiles")
except ImportError as e:
    logger.error(f"Failed to import StaticFiles: {e}")
    raise
try:
    import os
    logger.info("Imported os")
except ImportError as e:
    logger.error(f"Failed to import os: {e}")
    raise

# The UPLOAD_DIR is 'backend/static/uploads'. We need to serve the 'backend/static' directory.
# os.path.dirname(settings.UPLOAD_DIR) will give 'backend/static'
static_files_directory = os.path.dirname(settings.UPLOAD_DIR)
logger.debug(f"Static files directory: {static_files_directory}")

# Ensure the static directory itself exists, though UPLOAD_DIR creation already implies its parent exists.
# os.makedirs(static_files_directory, exist_ok=True) # This line is actually not needed if UPLOAD_DIR is within static_files_directory

app.mount("/static", StaticFiles(directory=static_files_directory), name="static")
logger.info("Static files mounted.")
logger.info("main.py setup complete.")