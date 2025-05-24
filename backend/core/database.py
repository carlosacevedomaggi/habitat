from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import models
from .config import settings

# Import settings
# from .config import settings

# Placeholder for settings if config.py is not fully set up yet
# DATABASE_URL = "postgresql+psycopg2://user:password@localhost/habitatdb" # Replace with settings.DATABASE_URL
# SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Determine if using SQLite to add connect args
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models (can be imported from models.py instead)
# Base = declarative_base() 

# Create all tables (development convenience; use Alembic for prod)
models.Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 