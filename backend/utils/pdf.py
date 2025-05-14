from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas


def generate_contact_pdf(submission):
    """Return bytes representing PDF for a contact submission."""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=LETTER)
    textobject = c.beginText(40, 750)
    textobject.setFont("Helvetica", 12)

    lines = [
        f"Contact Submission #{submission.id}",
        "",  # empty line
        f"Name: {submission.name}",
        f"Email: {submission.email}",
        f"Phone: {submission.phone or '-'}",
        f"Subject: {submission.subject}",
        "",
        "Message:",
    ]
    # Split message
    for line in submission.message.splitlines():
        lines.append(line)

    for line in lines:
        textobject.textLine(line)

    c.drawText(textobject)
    c.showPage()
    c.save()

    pdf = buffer.getvalue()
    buffer.close()
    return pdf 