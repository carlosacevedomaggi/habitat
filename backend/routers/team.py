import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

logger.info("Loading team router...")

try:
    from fastapi import APIRouter, Depends, HTTPException, status
    logger.info("Imported from fastapi")
except ImportError as e:
    logger.error(f"Failed to import from fastapi: {e}")
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
    from crud import team as crud_team
    logger.info("Imported team as crud_team from crud")
except ImportError as e:
    logger.error(f"Failed to import crud_team: {e}")
    raise
try:
    from auth import utils as auth_utils
    logger.info("Imported utils as auth_utils from auth")
except ImportError as e:
    logger.error(f"Failed to import auth_utils: {e}")
    raise

router = APIRouter()
logger.info("Team router APIRouter initialized.")

@router.get("/", response_model=List[schemas.TeamMember])
def read_team(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.debug(f"GET /api/team/ called. Skip: {skip}, Limit: {limit}")
    try:
        members = crud_team.get_team_members(db, skip, limit)
        logger.debug(f"Retrieved {len(members)} team members.")
        return members
    except Exception as e:
        logger.error(f"Error in read_team: {e}", exc_info=True)
        raise

@router.get("/{member_id}/", response_model=schemas.TeamMember)
def read_member(member_id: int, db: Session = Depends(get_db)):
    logger.debug(f"GET /api/team/{member_id} called.")
    try:
        member = crud_team.get_team_member(db, member_id)
        if not member:
            logger.warn(f"Team member with id {member_id} not found.")
            raise HTTPException(status_code=404, detail="Team member not found")
        logger.debug(f"Retrieved team member: {member.name}")
        return member
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in read_member for id {member_id}: {e}", exc_info=True)
        raise

@router.post("/", response_model=schemas.TeamMember, status_code=status.HTTP_201_CREATED)
def create_member(member_in: schemas.TeamMemberCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"POST /api/team/ called by admin {current_user.username} to create member: {member_in.name}")
    try:
        new_member = crud_team.create_team_member(db, member_in)
        logger.info(f"Team member '{new_member.name}' created with id {new_member.id}.")
        return new_member
    except Exception as e:
        logger.error(f"Error in create_member for {member_in.name}: {e}", exc_info=True)
        raise

@router.put("/{member_id}/", response_model=schemas.TeamMember)
def update_member(member_id: int, member_update: schemas.TeamMemberUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"PUT /api/team/{member_id} called by admin {current_user.username} with update: {member_update.dict(exclude_unset=True)}")
    try:
        db_member = crud_team.get_team_member(db, member_id)
        if not db_member:
            logger.warn(f"Team member with id {member_id} not found for update.")
            raise HTTPException(status_code=404, detail="Team member not found")
        updated_member = crud_team.update_team_member(db, db_member, member_update)
        logger.info(f"Team member id {member_id} ({updated_member.name}) updated.")
        return updated_member
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_member for id {member_id}: {e}", exc_info=True)
        raise

@router.delete("/{member_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_admin)):
    logger.debug(f"DELETE /api/team/{member_id} called by admin {current_user.username}")
    try:
        db_member = crud_team.get_team_member(db, member_id)
        if not db_member:
            logger.warn(f"Team member with id {member_id} not found for deletion.")
            raise HTTPException(status_code=404, detail="Team member not found")
        crud_team.delete_team_member(db, db_member)
        logger.info(f"Team member id {member_id} deleted.")
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_member for id {member_id}: {e}", exc_info=True)
        raise
logger.info("Team router loaded successfully.")