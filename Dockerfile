FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY backend/package.json ./
RUN npm install --production
COPY backend/server.js ./
COPY --from=builder /app/frontend/dist ./public

RUN sed -i 's|app.use(cors.*|app.use(cors());|' server.js || true

EXPOSE 3001
ENV NODE_ENV=production

RUN echo 'import express from "express";' > serve.js && \
    echo 'import { createServer } from "http";' >> serve.js && \
    echo 'const app2 = (await import("./server.js")).default;' >> serve.js

CMD ["node", "server.js"]
