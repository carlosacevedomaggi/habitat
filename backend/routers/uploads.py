from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
# from fastapi.responses import JSONResponse # Not used
import shutil
import os
import uuid # For generating unique filenames

from ..auth import utils as auth_utils
from ..core.config import settings
from .. import schemas # Import your actual schemas
from ..models import User # To type hint current_user

router = APIRouter()

# Ensure base upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Specific directories for properties and team uploads
PROPERTY_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "properties")
TEAM_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "team")

os.makedirs(PROPERTY_UPLOAD_DIR, exist_ok=True)
os.makedirs(TEAM_UPLOAD_DIR, exist_ok=True)

@router.post("/{upload_type}", response_model=schemas.UploadResponse)
async def upload_file(
    upload_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(auth_utils.get_current_active_user) # Use actual dependency and type hint
):
    """Handle file uploads (e.g., for property images, team member photos)."""
    # Authorization check: Example - allow only admins or editors
    # if not current_user.is_admin and not current_user.is_editor:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload files")

    # Support flexible upload types (e.g., 'properties', 'team', 'general').
    allowed_types = ["properties", "team", "general"]
    if upload_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid upload type specified. Valid types are {', '.join(allowed_types)}.")

    # Ensure directory exists for this upload type
    target_dir = os.path.join(settings.UPLOAD_DIR, upload_type)
    os.makedirs(target_dir, exist_ok=True)

    try:
        original_filename = os.path.basename(file.filename)
        if not original_filename:
            raise HTTPException(status_code=400, detail="Filename cannot be empty.")

        # Sanitize filename and make it unique
        file_extension = os.path.splitext(original_filename)[1]
        # A more robust sanitization might be needed for production
        sanitized_name_part = "".join(c if c.isalnum() or c in ['_', '.'] else '_' for c in os.path.splitext(original_filename)[0])
        unique_filename = f"{sanitized_name_part}_{uuid.uuid4().hex}{file_extension}"
        
        file_path = os.path.join(target_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Construct URL to access the file
        # Assumes backend/static/ is mounted as /static/
        # settings.UPLOAD_DIR should be 'backend/static/uploads'
        # settings.API_BASE_URL should be 'http://localhost:8000' (or actual deployed URL)
        # Resulting URL: http://localhost:8000/static/uploads/properties/filename.jpg
        file_url = f"{settings.API_BASE_URL}/static/uploads/{upload_type}/{unique_filename}"
        
        return schemas.UploadResponse(filename=unique_filename, url=file_url)
    except HTTPException: # Re-raise HTTPExceptions directly
        raise
    except Exception as e:
        # Log the exception e here in a real application
        # logger.error(f"File upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not upload file: An unexpected error occurred.")
    finally:
        await file.close() # Ensure the file is closed (use await for UploadFile.close) 