# backend/Dockerfile
FROM python:3.12-slim

# Basic hygiene
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

# System deps (only if you need them). With psycopg2-binary you usually don't.
# RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy source and install your package (uses pyproject.toml)
COPY pyproject.toml ./
COPY src ./src
RUN pip install --upgrade pip && pip install .

# Runtime config & entrypoint
COPY gunicorn.conf.py wsgi.py ./

# (Optional) run as non-root
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck hits your /health route
# If you didn't install curl above, comment this or install curl.
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
#   CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

EXPOSE 8080
CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
