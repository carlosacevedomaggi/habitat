import logging as python_logging # Alias to avoid conflict with local logger variable
logger = python_logging.getLogger(__name__)
logger.setLevel(python_logging.DEBUG)

logger.info("Loading uploads router...")

try:
    from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
    logger.info("Imported from fastapi")
except ImportError as e:
    logger.error(f"Failed to import from fastapi: {e}")
    raise
# from fastapi.responses import JSONResponse # Not used
try:
    import shutil
    logger.info("Imported shutil")
except ImportError as e:
    logger.error(f"Failed to import shutil: {e}")
    raise
try:
    import os
    logger.info("Imported os")
except ImportError as e:
    logger.error(f"Failed to import os: {e}")
    raise
try:
    import uuid # For generating unique filenames
    logger.info("Imported uuid")
except ImportError as e:
    logger.error(f"Failed to import uuid: {e}")
    raise

try:
    from auth import utils as auth_utils
    logger.info("Imported utils as auth_utils from auth")
except ImportError as e:
    logger.error(f"Failed to import auth_utils: {e}")
    raise
try:
    from core.config import settings
    logger.info("Imported settings from core.config")
except ImportError as e:
    logger.error(f"Failed to import settings from core.config: {e}")
    raise
try:
    import schemas # Import your actual schemas
    logger.info("Imported schemas")
except ImportError as e:
    logger.error(f"Failed to import schemas: {e}")
    raise
try:
    from models import User # To type hint current_user
    logger.info("Imported User from models")
except ImportError as e:
    logger.error(f"Failed to import User from models: {e}")
    raise

router = APIRouter()
logger.info("Uploads router APIRouter initialized.")

# Ensure base upload directory exists
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Base upload directory {settings.UPLOAD_DIR} ensured.")
except Exception as e:
    logger.error(f"Failed to create base upload directory {settings.UPLOAD_DIR}: {e}", exc_info=True)
    # Depending on severity, you might want to raise an error here or handle it
    # For now, we'll let it proceed and potentially fail later if paths are critical

# Specific directories for properties and team uploads
PROPERTY_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "properties")
TEAM_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "team")
GENERAL_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "general") # Added for consistency

try:
    os.makedirs(PROPERTY_UPLOAD_DIR, exist_ok=True)
    logger.info(f"Property upload directory {PROPERTY_UPLOAD_DIR} ensured.")
    os.makedirs(TEAM_UPLOAD_DIR, exist_ok=True)
    logger.info(f"Team upload directory {TEAM_UPLOAD_DIR} ensured.")
    os.makedirs(GENERAL_UPLOAD_DIR, exist_ok=True)
    logger.info(f"General upload directory {GENERAL_UPLOAD_DIR} ensured.")
except Exception as e:
    logger.error(f"Failed to create specific upload subdirectories: {e}", exc_info=True)


# Use the main app logger if desired, or a specific one for uvicorn errors
# logger = python_logging.getLogger("uvicorn.error") # This was the original, might be too specific
# Using the module's own logger, configured at the top, is generally better for module-specific logs.

@router.post("/{upload_type}/", response_model=schemas.UploadResponse)
async def upload_file(
    upload_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(auth_utils.require_manager)
):
    logger.debug(f"POST /api/uploads/{upload_type} called by user {current_user.username} for file: {file.filename}")
    # Authorization check: Example - allow only admins or editors
    # if not current_user.is_admin and not current_user.is_editor:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload files")

    # Support flexible upload types (e.g., 'properties', 'team', 'general').
    allowed_types = ["properties", "team", "general"]
    if upload_type not in allowed_types:
        logger.warn(f"Invalid upload_type '{upload_type}' specified by user {current_user.username}.")
        raise HTTPException(status_code=400, detail=f"Invalid upload type specified. Valid types are {', '.join(allowed_types)}.")

    # Ensure directory exists for this upload type
    target_dir = os.path.join(settings.UPLOAD_DIR, upload_type)
    try: # Added try-except for directory creation during request as a fallback
        os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        logger.error(f"Could not create target directory {target_dir} during upload request: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not prepare upload location.")


    try:
        original_filename = os.path.basename(file.filename) if file.filename else "" # Handle None filename
        if not original_filename:
            logger.warn(f"Upload attempt by {current_user.username} with empty filename.")
            raise HTTPException(status_code=400, detail="Filename cannot be empty.")

        # Sanitize filename and make it unique
        file_extension = os.path.splitext(original_filename)[1]
        # A more robust sanitization might be needed for production
        sanitized_name_part = "".join(c if c.isalnum() or c in ['_', '.'] else '_' for c in os.path.splitext(original_filename)[0])
        unique_filename = f"{sanitized_name_part}_{uuid.uuid4().hex}{file_extension}"
        
        file_path = os.path.join(target_dir, unique_filename)
        logger.debug(f"Attempting to save uploaded file to: {file_path}")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File '{unique_filename}' uploaded successfully to {target_dir} by user {current_user.username}.")
        
        # Construct absolute URL to access the file via static route
        # e.g., http://your-api-domain/static/uploads/properties/filename.jpg
        file_url = f"{settings.API_BASE_URL}/static/uploads/{upload_type}/{unique_filename}"
        logger.debug(f"Generated file URL: {file_url}")
        
        return schemas.UploadResponse(filename=unique_filename, url=file_url)
    except HTTPException: # Re-raise HTTPExceptions directly
        raise
    except Exception as e:
        logger.error(f"File upload failed for {original_filename if 'original_filename' in locals() else 'unknown file'} by {current_user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not upload file: An unexpected error occurred.")
    finally:
        # Ensure the file is closed, swallow any errors during close
        try:
            await file.close()
            logger.debug(f"UploadFile {file.filename if file else ''} closed.")
        except Exception as e_close:
            logger.warn(f"Error closing uploaded file {file.filename if file else ''}: {e_close}", exc_info=True)
            pass
logger.info("Uploads router loaded successfully.")