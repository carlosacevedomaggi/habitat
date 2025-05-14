from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..core.database import get_db
from ..crud import team as crud_team
from ..auth import utils as auth_utils

router = APIRouter()

@router.get("/", response_model=List[schemas.TeamMember])
def read_team(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_team.get_team_members(db, skip, limit)

@router.get("/{member_id}", response_model=schemas.TeamMember)
def read_member(member_id: int, db: Session = Depends(get_db)):
    member = crud_team.get_team_member(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member

@router.post("/", response_model=schemas.TeamMember, status_code=status.HTTP_201_CREATED)
def create_member(member_in: schemas.TeamMemberCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_admin)):
    return crud_team.create_team_member(db, member_in)

@router.put("/{member_id}", response_model=schemas.TeamMember)
def update_member(member_id: int, member_update: schemas.TeamMemberUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_admin)):
    db_member = crud_team.get_team_member(db, member_id)
    if not db_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return crud_team.update_team_member(db, db_member, member_update)

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_admin)):
    db_member = crud_team.get_team_member(db, member_id)
    if not db_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    crud_team.delete_team_member(db, db_member)
    return 