from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from sqlalchemy.orm import Session
from typing import List
import os, smtplib, ssl
from email.message import EmailMessage

from .. import schemas, models
from ..core.database import get_db
from ..crud import contacts as crud_contact
from ..auth import utils as auth_utils
from ..utils.pdf import generate_contact_pdf

router = APIRouter()

@router.post("/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED)
def create_submission(submission: schemas.ContactCreate, db: Session = Depends(get_db)):
    return crud_contact.create_contact(db, submission)

@router.get("/", response_model=List[schemas.Contact])
def list_submissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_staff)):
    return crud_contact.get_contacts(db, skip, limit)

@router.get("/{submission_id}", response_model=schemas.Contact)
def get_submission(submission_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_staff)):
    db_contact = crud_contact.get_contact(db, submission_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="Submission not found")
    return db_contact

@router.put("/{submission_id}", response_model=schemas.Contact)
def update_submission(submission_id: int, submission_update: schemas.ContactUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_manager)):
    db_contact = crud_contact.get_contact(db, submission_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="Submission not found")
    return crud_contact.update_contact(db, db_contact, submission_update)

@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(submission_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_manager)):
    db_contact = crud_contact.get_contact(db, submission_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.delete(db_contact)
    db.commit()
    return

# --- PDF route (placeholder) ---

@router.get("/{submission_id}/pdf")
def generate_contact_pdf_route(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.require_manager),
):
    """Generate a PDF for a contact submission (Protected)."""
    submission = crud_contact.get_contact(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    pdf_content = generate_contact_pdf(submission)
    return Response(content=pdf_content, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=contact_{submission_id}.pdf"})

# Helper to send email
def send_contact_email(submission, recipient_email: str):
    smtp_server = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    if not smtp_server or not smtp_user or not smtp_pass:
        raise RuntimeError("SMTP credentials not configured in env vars")

    msg = EmailMessage()
    msg["Subject"] = f"Nuevo mensaje de {submission.name} en Habitat"
    msg["From"] = smtp_user
    msg["To"] = recipient_email
    body = f"Nombre: {submission.name}\nEmail: {submission.email}\nTeléfono: {submission.phone}\nAsunto: {submission.subject}\n\nMensaje:\n{submission.message}"
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls(context=context)
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)

@router.post("/{submission_id}/send-email", status_code=status.HTTP_204_NO_CONTENT)
def forward_submission_via_email(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.require_manager),
    recipient_email: str | None = Body(None, embed=True),
):
    """Send a submission via email to the configured contact email in settings."""
    submission = crud_contact.get_contact(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if recipient_email in (None, ""):
        settings_row = db.query(models.SiteSettings).filter(models.SiteSettings.key == "contact_email").first()
        if settings_row:
            recipient_email = settings_row.value.get("text") if isinstance(settings_row.value, dict) else settings_row.value
        if not recipient_email:
            # default to current admin's email
            recipient_email = current_user.email
        if not recipient_email:
            raise HTTPException(status_code=400, detail="No recipient email available.")
    try:
        send_contact_email(submission, recipient_email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return 