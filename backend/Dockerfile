# Use Python slim with uv pre-installed via COPY
FROM python:3.13-slim

WORKDIR /app

# Install uv directly
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first
COPY pyproject.toml uv.lock* ./

# Install dependencies (cached unless pyproject.toml changes)
RUN uv pip install --system -e .

# Copy application code (changes frequently, so last)
COPY . .

RUN mkdir -p images

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
