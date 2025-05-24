import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

logger.info("Loading users router...")

try:
    from fastapi import APIRouter, Depends, HTTPException, status
    logger.info("Imported from fastapi")
except ImportError as e:
    logger.error(f"Failed to import from fastapi: {e}")
    raise
try:
    from fastapi.security import OAuth2PasswordRequestForm
    logger.info("Imported OAuth2PasswordRequestForm from fastapi.security")
except ImportError as e:
    logger.error(f"Failed to import OAuth2PasswordRequestForm: {e}")
    raise
try:
    from sqlalchemy.orm import Session
    logger.info("Imported Session from sqlalchemy.orm")
except ImportError as e:
    logger.error(f"Failed to import Session from sqlalchemy.orm: {e}")
    raise
try:
    from typing import List
    logger.info("Imported List from typing")
except ImportError as e:
    logger.error(f"Failed to import List from typing: {e}")
    raise
try:
    from datetime import timedelta
    logger.info("Imported timedelta from datetime")
except ImportError as e:
    logger.error(f"Failed to import timedelta from datetime: {e}")
    raise

# Import models, schemas, crud, auth functions, and db session dependency
try:
    import schemas, models
    logger.info("Imported schemas, models")
except ImportError as e:
    logger.error(f"Failed to import schemas, models: {e}")
    raise
try:
    from core.database import get_db
    logger.info("Imported get_db from core.database")
except ImportError as e:
    logger.error(f"Failed to import get_db from core.database: {e}")
    raise
try:
    from core.config import settings
    logger.info("Imported settings from core.config")
except ImportError as e:
    logger.error(f"Failed to import settings from core.config: {e}")
    raise
try:
    from auth import utils as auth_utils
    logger.info("Imported utils as auth_utils from auth")
except ImportError as e:
    logger.error(f"Failed to import auth_utils: {e}")
    raise
try:
    from crud import user as crud_user
    logger.info("Imported user as crud_user from crud")
except ImportError as e:
    logger.error(f"Failed to import crud_user: {e}")
    raise

router = APIRouter()
logger.info("Users router APIRouter initialized.")

# Placeholder dependencies - replace with actual implementations
oauth_scheme = auth_utils.oauth2_scheme
logger.debug("OAuth2 scheme set.")

# ------------------- Auth endpoints -------------------

@router.post("/token/", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    logger.debug(f"POST /api/users/token called for username: {form_data.username}")
    try:
        user = auth_utils.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warn(f"Authentication failed for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_utils.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        logger.info(f"Access token created for user: {user.username}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login_for_access_token for {form_data.username}: {e}", exc_info=True)
        raise


@router.get("/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth_utils.get_current_active_user)):
    logger.debug(f"GET /api/users/me called for user: {current_user.username}")
    return current_user

# ------------------- CRUD endpoints -------------------

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user_route(user_in: schemas.UserCreate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"POST /api/users/ called by admin {current_admin.username} to create user: {user_in.username}")
    try:
        db_user = crud_user.get_user_by_username(db, username=user_in.username)
        if db_user:
            logger.warn(f"Attempt to create existing user: {user_in.username}")
            raise HTTPException(status_code=400, detail="Username already registered")
        new_user = crud_user.create_user(db=db, user_in=user_in)
        logger.info(f"User '{new_user.username}' created with id {new_user.id}.")
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_user_route for {user_in.username}: {e}", exc_info=True)
        raise


@router.get("/", response_model=List[schemas.User])
def list_users_route(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_manager)):
    logger.debug(f"GET /api/users/ called by user {current_user.username}. Skip: {skip}, Limit: {limit}")
    try:
        users = crud_user.get_users(db, skip=skip, limit=limit)
        logger.debug(f"Retrieved {len(users)} users.")
        return users
    except Exception as e:
        logger.error(f"Error in list_users_route: {e}", exc_info=True)
        raise


@router.get("/{user_id}/", response_model=schemas.User)
def get_user_route(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"GET /api/users/{user_id} called by admin {current_admin.username}")
    try:
        db_user = crud_user.get_user(db, user_id=user_id)
        if db_user is None:
            logger.warn(f"User with id {user_id} not found.")
            raise HTTPException(status_code=404, detail="User not found")
        logger.debug(f"Retrieved user: {db_user.username}")
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user_route for id {user_id}: {e}", exc_info=True)
        raise


@router.put("/{user_id}/", response_model=schemas.User)
def update_user_route(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"PUT /api/users/{user_id} called by admin {current_admin.username} with update: {user_update.dict(exclude_unset=True)}")
    try:
        db_user = crud_user.get_user(db, user_id=user_id)
        if db_user is None:
            logger.warn(f"User with id {user_id} not found for update.")
            raise HTTPException(status_code=404, detail="User not found")
        updated_user = crud_user.update_user(db=db, db_user=db_user, user_update=user_update)
        logger.info(f"User id {user_id} ({updated_user.username}) updated.")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_user_route for id {user_id}: {e}", exc_info=True)
        raise


@router.delete("/{user_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_route(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"DELETE /api/users/{user_id} called by admin {current_admin.username}")
    try:
        db_user = crud_user.get_user(db, user_id=user_id)
        if db_user is None:
            logger.warn(f"User with id {user_id} not found for deletion.")
            raise HTTPException(status_code=404, detail="User not found")
        crud_user.delete_user(db=db, db_user=db_user)
        logger.info(f"User id {user_id} deleted.")
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_user_route for id {user_id}: {e}", exc_info=True)
        raise

# dependency
def get_current_active_user(current_user=Depends(auth_utils.get_current_active_user)):
    logger.debug("get_current_active_user dependency called.")
    return current_user

ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
logger.info("Users router loaded successfully.")