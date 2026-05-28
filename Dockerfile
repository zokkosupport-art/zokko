# Zokko — build frontend + API (sans Emergent)
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY frontend/ .
ARG REACT_APP_BACKEND_URL=
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV CI=false
RUN npm run build

FROM python:3.11-slim
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
RUN chmod +x start.sh
COPY --from=frontend-build /app/frontend/build /app/frontend/build
ENV FRONTEND_BUILD=/app/frontend/build
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["/app/backend/start.sh"]
