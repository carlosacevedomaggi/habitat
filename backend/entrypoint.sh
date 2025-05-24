#!/usr/bin/env bash
set -e

# Run database migrations
echo "Running database migrations..."
alembic -c alembic.ini upgrade head

# Seed initial data only if the database is empty
echo "Seeding initial data..."
python seed_data.py

# Start the application
echo "Starting server with direct Uvicorn call for debugging..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug