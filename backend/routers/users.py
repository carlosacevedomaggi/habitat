from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

# Import models, schemas, crud, auth functions, and db session dependency
from .. import schemas, models
from ..core.database import get_db
from ..core.config import settings
from ..auth import utils as auth_utils
from ..crud import user as crud_user

router = APIRouter()

# Placeholder dependencies - replace with actual implementations
oauth_scheme = auth_utils.oauth2_scheme

# ------------------- Auth endpoints -------------------

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = auth_utils.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth_utils.get_current_active_user)):
    return current_user

# ------------------- CRUD endpoints -------------------

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user_route(user_in: schemas.UserCreate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    db_user = crud_user.get_user_by_username(db, username=user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_user.create_user(db=db, user_in=user_in)


@router.get("/", response_model=List[schemas.User])
def list_users_route(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    users = crud_user.get_users(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=schemas.User)
def get_user_route(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/{user_id}", response_model=schemas.User)
def update_user_route(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud_user.update_user(db=db, db_user=db_user, user_update=user_update)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_route(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    crud_user.delete_user(db=db, db_user=db_user)
    return

# dependency
def get_current_active_user(current_user=Depends(auth_utils.get_current_active_user)):
    return current_user

ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES 