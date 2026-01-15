FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install

COPY . .

RUN npm run build || echo "Frontend build skipped"

EXPOSE 5000

ENV NODE_ENV=production
ENV PYTHONPATH=/app/python_backend

CMD ["python", "python_backend/main.py"]
