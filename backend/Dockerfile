# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Set environment variables (optional, can also be set at runtime)
# ENV PYTHONDONTWRITEBYTECODE 1
# ENV PYTHONUNBUFFERED 1

# Install system dependencies (if any)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     # Example: for PostgreSQL client tools or other build dependencies
#     # libpq-dev gcc \
#  && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY ./requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into a 'backend' package directory
COPY . /app/backend

# Switch into the backend code directory
WORKDIR /app/backend

# Make port 8000 available to the world outside this container (FastAPI default)
EXPOSE 8000

# Define command to run the app using Uvicorn
# The command should be to run main:app from the `main.py` file in the /app directory
# Example: CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# If your main FastAPI app instance is in /app/main.py as `app`:
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 
# Use --reload for development, remove for production
# For production, you might also use more workers: --workers 4 