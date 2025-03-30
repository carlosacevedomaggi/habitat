from server import app, db, init_db

with app.app_context():
    print("Running create_tables.py...")
    init_db()
    print("Database initialization complete!") 