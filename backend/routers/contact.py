from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..core.database import get_db
from ..crud import contacts as crud_contact
from ..auth import utils as auth_utils

router = APIRouter()

@router.post("/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED)
def create_submission(submission: schemas.ContactCreate, db: Session = Depends(get_db)):
    return crud_contact.create_contact(db, submission)

@router.get("/", response_model=List[schemas.Contact])
def list_submissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    return crud_contact.get_contacts(db, skip, limit)

@router.get("/{submission_id}", response_model=schemas.Contact)
def get_submission(submission_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    db_contact = crud_contact.get_contact(db, submission_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="Submission not found")
    return db_contact

@router.put("/{submission_id}", response_model=schemas.Contact)
def update_submission(submission_id: int, submission_update: schemas.ContactUpdate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth_utils.require_admin)):
    db_contact = crud_contact.get_contact(db, submission_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="Submission not found")
    return crud_contact.update_contact(db, db_contact, submission_update)

# --- PDF route (placeholder) ---

@router.get("/{submission_id}/pdf")
def generate_contact_pdf_route(
    submission_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth_utils.require_admin),
):
    """Generate a PDF for a contact submission (Protected)."""
    submission = crud_contact.get_contact(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # pdf_content = generate_contact_pdf(submission) # Actual PDF generation logic
    # return Response(content=pdf_content, media_type="application/pdf", 
    #                 headers={"Content-Disposition": f"attachment; filename=contact_{submission_id}.pdf"})
    return Response(content=f"PDF for submission {submission_id}", media_type="application/pdf") # Placeholder 