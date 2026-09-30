# One container = frontend + backend + live pipeline, served on a single URL.

# --- Stage 1: build the React frontend ---
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
ENV VITE_API_URL=/api
RUN npm run build

# --- Stage 2: Python backend that also serves the built frontend ---
FROM python:3.12-slim
# libgomp1 is needed by XGBoost/LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt \
    xgboost==3.4.1 scikit-learn==1.6.1 lightgbm==4.6.0 numpy==2.1.3 \
    pandas==2.2.3 scipy==1.16.3 joblib==1.6.0

COPY backend/ backend/
COPY --from=web /web/dist frontend/dist
RUN mkdir -p backend/data && chown -R user:user /app
USER user

ENV HOST=0.0.0.0 PORT=7860 AUTO_PIPELINE=1
EXPOSE 7860
WORKDIR /app/backend
CMD ["python", "app.py"]
