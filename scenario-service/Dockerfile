FROM python:3.12-slim

WORKDIR /app

# копіюємо залежності.
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY scenario-service/ .

# сервіс працює на 8000.
EXPOSE 8000

# FastAPI.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]