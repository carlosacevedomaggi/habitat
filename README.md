# Habitat – Monolith ➜ 2-Tier Migration (Next.js + FastAPI)

> ⚠️  *Work-in-Progress (WIP)* – The project is currently being migrated from a Flask/Jinja2 monolith to a modern **Next.js (React)** frontend and **FastAPI** backend.  Both codebases now live in-repo side-by-side with the original Flask app for reference.

## Quick-start (new stack)

### Prerequisites
1. Node.js ≥ 18 (for the Next.js frontend)
2. Python ≥ 3.10 (for the FastAPI backend)
3. PostgreSQL 14+ (or SQLite for quick local tests)

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# copy .env.sample -> .env and edit DATABASE_URL / SECRET_KEY
uvicorn backend.main:app --reload
```
API will be available at `http://localhost:8000`.

### Frontend (Next.js)
```bash
cd frontend
npm install          # or pnpm / yarn
npm run dev          # starts on http://localhost:3000
```

### Directory snapshot (WIP)
```
frontend/        Next.js 14 app (pages/, components/, services/, styles/)
backend/         FastAPI app (routers/, models.py, schemas.py, core/, auth/)
legacy/          Flask monolith (server.py, templates/, static/) – pending removal
```

---

Below is the original README describing the **legacy Flask application**.  Until the migration finishes it remains for reference.

## Features

- Property listings with map integration
- Team member management
- Contact form with PDF export
- Admin dashboard
- Dynamic content management
- Responsive design
- Image upload handling
- Dark theme

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Habitatt.git
cd Habitatt
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with:
```
FLASK_APP=server.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

5. Initialize the database:
```bash
python server.py
```

6. Run the development server:
```bash
flask run
```

The application will be available at `http://localhost:5000`

## Default Admin Account

- Username: admin
- Password: admin123

**Important**: Change these credentials in production!

## Directory Structure

```
Habitatt/
├── static/
│   ├── images/
│   ├── uploads/
│   ├── style.css
│   └── script.js
├── templates/
│   ├── admin/
│   ├── base.html
│   ├── index.html
│   └── ...
├── server.py
├── requirements.txt
└── README.md
```

## Deployment

### Using a VPS:

1. Set up a server with Ubuntu/Debian
2. Install required packages:
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx supervisor
```

3. Clone the repository and set up the application
4. Configure Nginx and Supervisor
5. Set up SSL with Let's Encrypt

### Using Platform as a Service:

The application is ready for deployment on platforms like:
- Heroku
- DigitalOcean App Platform
- Google Cloud Platform
- AWS Elastic Beanstalk

## Maintenance

1. Regular backups:
- Database backups
- Uploaded images backup
- Configuration backup

2. Updates:
- Keep dependencies updated
- Monitor error logs
- Update SSL certificates

3. Monitoring:
- Set up error tracking
- Monitor server resources
- Check application logs

## Security Considerations

1. Change default admin credentials
2. Use strong SECRET_KEY
3. Keep dependencies updated
4. Use HTTPS in production
5. Implement rate limiting
6. Regular security audits

## License

MIT License

## Support

For support, please open an issue in the repository or contact the development team.

## Recent Feature Updates (May 2025)

1.  **Property Listing Type:**
    *   Added a "Listing Type" (Tipo de Listado) to property details, allowing properties to be categorized as "Venta de propiedad" (Property Sale) or "Renta" (Rental).
    *   The admin panel's property form now includes a dropdown to set this attribute.
    *   This information is displayed on individual property cards (`/properties` page) and on the detailed property view page.
    *   Database schema for the `Property` table was updated to include the `listing_type` column. Server-side logic in `server.py` handles saving and retrieving this new field, with robust type conversions for all form inputs.

2.  **Image Carousel for Property Cards:**
    *   Property cards on the `/properties` page now feature an image carousel if multiple images are associated with a property.
    *   Left and right arrow icons allow users to manually navigate through the images.
    *   JavaScript in `static/script.js` handles the image switching logic.
    *   CSS in `static/style.css` styles the arrows and image display.

3.  **TikTok Integration:**
    *   Added a "TikTok Profile URL" field to the site settings in the admin panel.
    *   The TikTok icon and link (retrieved from site settings) are now displayed in the website footer (`templates/base.html`) and on the contact page (`templates/contact.html`).
    *   Default settings for Facebook, Instagram, LinkedIn, and WhatsApp URLs were also added/standardized in the admin settings under the 'social' category.

4.  **Database and Environment Fixes:**
    *   Resolved `ModuleNotFoundError` by installing dependencies from `requirements.txt` into the virtual environment.
    *   Addressed `sqlite3.OperationalError: no such column: property.listing_type` by recreating the database to incorporate the new schema.
    *   Fixed Jinja2 template syntax errors related to list manipulation and unknown tags.
