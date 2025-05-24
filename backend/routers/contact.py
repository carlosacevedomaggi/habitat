import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

logger.info("Loading contact router...")

try:
    from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
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
    import os, smtplib, ssl
    logger.info("Imported os, smtplib, ssl")
except ImportError as e:
    logger.error(f"Failed to import os, smtplib, ssl: {e}")
    raise
try:
    from email.message import EmailMessage
    logger.info("Imported EmailMessage from email.message")
except ImportError as e:
    logger.error(f"Failed to import EmailMessage: {e}")
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
    from crud import contact as crud_contact # Assuming contacts.py is renamed or this is correct
    logger.info("Imported contact as crud_contact from crud")
except ImportError as e:
    logger.error(f"Failed to import crud_contact: {e}") # Check if this should be crud.contacts
    raise
try:
    from auth import utils as auth_utils
    logger.info("Imported utils as auth_utils from auth")
except ImportError as e:
    logger.error(f"Failed to import auth_utils: {e}")
    raise
try:
    from utils.pdf import generate_contact_pdf
    logger.info("Imported generate_contact_pdf from utils.pdf")
except ImportError as e:
    logger.error(f"Failed to import generate_contact_pdf: {e}")
    raise

router = APIRouter()
logger.info("Contact router APIRouter initialized.")

@router.post("/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED)
def create_submission(submission: schemas.ContactCreate, db: Session = Depends(get_db)):
    logger.debug(f"POST /api/contact/ called with submission subject: {submission.subject}")
    try:
        new_submission = crud_contact.create_contact(db, submission)
        logger.info(f"Contact submission '{new_submission.subject}' created with id {new_submission.id}.")
        # Consider sending email notification here if desired for all new contacts
        return new_submission
    except Exception as e:
        logger.error(f"Error in create_submission for {submission.subject}: {e}", exc_info=True)
        raise

@router.get("/", response_model=List[schemas.Contact])
def list_submissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_staff)):
    logger.debug(f"GET /api/contact/ called by user {current_user.username}. Skip: {skip}, Limit: {limit}")
    try:
        submissions = crud_contact.get_contacts(db, current_user, skip, limit)
        logger.debug(f"Retrieved {len(submissions)} contact submissions.")
        return submissions
    except Exception as e:
        logger.error(f"Error in list_submissions: {e}", exc_info=True)
        raise

@router.get("/{submission_id}/", response_model=schemas.Contact)
def get_submission(submission_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_staff)):
    logger.debug(f"GET /api/contact/{submission_id} called by user {current_user.username}")
    try:
        db_contact = crud_contact.get_contact(db, submission_id)
        if not db_contact:
            logger.warn(f"Contact submission with id {submission_id} not found.")
            raise HTTPException(status_code=404, detail="Submission not found")
        logger.debug(f"Retrieved contact submission: {db_contact.subject}")
        return db_contact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_submission for id {submission_id}: {e}", exc_info=True)
        raise

@router.put("/{submission_id}/", response_model=schemas.Contact)
def update_submission(submission_id: int, submission_update: schemas.ContactUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_manager)):
    logger.debug(f"PUT /api/contact/{submission_id} called by user {current_user.username} with update: {submission_update.dict(exclude_unset=True)}")
    try:
        db_contact = crud_contact.get_contact(db, submission_id)
        if not db_contact:
            logger.warn(f"Contact submission with id {submission_id} not found for update.")
            raise HTTPException(status_code=404, detail="Submission not found")
        updated_contact = crud_contact.update_contact(db, db_contact, submission_update)
        logger.info(f"Contact submission id {submission_id} updated.")
        return updated_contact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_submission for id {submission_id}: {e}", exc_info=True)
        raise

@router.delete("/{submission_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(submission_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_manager)):
    logger.debug(f"DELETE /api/contact/{submission_id} called by user {current_user.username}")
    try:
        db_contact = crud_contact.get_contact(db, submission_id)
        if not db_contact:
            logger.warn(f"Contact submission with id {submission_id} not found for deletion.")
            raise HTTPException(status_code=404, detail="Submission not found")
        db.delete(db_contact)
        db.commit()
        logger.info(f"Contact submission id {submission_id} deleted.")
        return
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_submission for id {submission_id}: {e}", exc_info=True)
        # Rollback in case of commit failure, though less likely here
        db.rollback()
        raise

# --- PDF route (placeholder) ---

@router.get("/{submission_id}/pdf/")
def generate_contact_pdf_route(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.require_manager),
):
    logger.debug(f"GET /api/contact/{submission_id}/pdf called by user {current_user.username}")
    try:
        submission = crud_contact.get_contact(db, submission_id)
        if not submission:
            logger.warn(f"Contact submission with id {submission_id} not found for PDF generation.")
            raise HTTPException(status_code=404, detail="Submission not found")
        
        pdf_content = generate_contact_pdf(submission)
        logger.info(f"PDF generated for contact submission id {submission_id}.")
        return Response(content=pdf_content, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=contact_{submission_id}.pdf"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_contact_pdf_route for id {submission_id}: {e}", exc_info=True)
        raise

# Helper to send email
def send_contact_email(submission, recipient_email: str):
    logger.debug(f"Attempting to send contact email for submission id {submission.id} to {recipient_email}")
    smtp_server = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587")) # Ensure SMTP_PORT is treated as int
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not all([smtp_server, smtp_user, smtp_pass]): # Check all required SMTP env vars
        logger.error("SMTP credentials (HOST, USER, PASS) not fully configured in env vars.")
        raise RuntimeError("SMTP credentials not configured in env vars")

    msg = EmailMessage()
    msg["Subject"] = f"Nuevo mensaje de {submission.name} en Habitat (ID: {submission.id})"
    msg["From"] = smtp_user
    msg["To"] = recipient_email
    body = f"Nombre: {submission.name}\nEmail: {submission.email}\nTeléfono: {submission.phone or '-'}\nAsunto: {submission.subject or '-'}\n\nMensaje:\n{submission.message}"
    msg.set_content(body)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info(f"Contact email for submission id {submission.id} sent successfully to {recipient_email}.")
    except Exception as e:
        logger.error(f"Failed to send contact email for submission id {submission.id} to {recipient_email}: {e}", exc_info=True)
        raise # Re-raise to be caught by the endpoint

@router.post("/{submission_id}/send-email/", status_code=status.HTTP_204_NO_CONTENT)
def forward_submission_via_email(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.require_manager),
    recipient_email: str | None = Body(None, embed=True),
):
    logger.debug(f"POST /api/contact/{submission_id}/send-email called by user {current_user.username}. Target email: {recipient_email or 'default'}")
    try:
        submission = crud_contact.get_contact(db, submission_id)
        if not submission:
            logger.warn(f"Contact submission with id {submission_id} not found for sending email.")
            raise HTTPException(status_code=404, detail="Submission not found")

        final_recipient_email = recipient_email
        if not final_recipient_email: # Check if None or empty string
            logger.debug("Recipient email not provided, attempting to use default from settings.")
            settings_row = db.query(models.SiteSettings).filter(models.SiteSettings.key == "contact_email").first()
            if settings_row and settings_row.value:
                # Handle if value is stored as {'text': 'email@example.com'} or just 'email@example.com'
                if isinstance(settings_row.value, dict):
                    final_recipient_email = settings_row.value.get("text")
                elif isinstance(settings_row.value, str):
                     final_recipient_email = settings_row.value

            if not final_recipient_email:
                logger.debug("Default contact_email from settings not found or empty, using current admin's email.")
                final_recipient_email = current_user.email
            
            if not final_recipient_email: # Still no email
                logger.error(f"No recipient email could be determined for submission id {submission_id}.")
                raise HTTPException(status_code=400, detail="No recipient email available (neither provided, in settings, nor admin email).")
        
        logger.info(f"Sending email for submission {submission_id} to {final_recipient_email}")
        send_contact_email(submission, final_recipient_email)
        return
    except HTTPException:
        raise
    except RuntimeError as e: # Catch SMTP config error specifically
        logger.error(f"RuntimeError (likely SMTP config) in forward_submission_via_email for id {submission_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) # Propagate SMTP config error message
    except Exception as e:
        logger.error(f"Unexpected error in forward_submission_via_email for id {submission_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while trying to send the email.")

logger.info("Contact router loaded successfully.")