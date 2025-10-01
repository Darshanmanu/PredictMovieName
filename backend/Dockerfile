# This Dockerfile builds the FastAPI backend for deployment on platforms
# like Google Cloud Run.  It installs dependencies, copies the application
# source code and launches Uvicorn.  Cloud Run will set the PORT
# environment variable; we use it when starting the server.

FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port Cloud Run will listen on
ENV PORT=8080

# Start the Uvicorn server.  Use `sh -c` so that the $PORT env var is
# substituted at runtime.  FastAPI's `app` object is defined in app.py.
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port $PORT"]