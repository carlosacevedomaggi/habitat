# Habitat

Modern real estate platform with Next.js (public + admin) and FastAPI backend.

Prerequisites
-------------
- Node.js ≥18
- Python ≥3.10
- (Optional) PostgreSQL or SQLite

Setup
-----
# Backend
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create .env (in backend/)
DATABASE_URL=sqlite:///../habitat_api.db
SECRET_KEY=<your_jwt_secret>
ALGORYTHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_CORS_ORIGINS=http://localhost:3000

# Migrations + seed
alebic upgrade head
python -m backend.seed_data

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd ../frontend
npm install

# Create .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

npm run dev

Usage
-----
Public:  http://localhost:3000
Admin:   http://localhost:3000/admin/login
(default admin: admin / Admin123!)

API Endpoints
-------------
GET    /api/properties/
GET    /api/properties/{id}
POST   /api/properties/{id}/track-click
POST   /api/contact/
... and other CRUD endpoints under /api/users, /api/settings, /api/team, /api/uploads

That's it.
