# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/ src/
COPY tsconfig.json ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

LABEL org.opencontainers.image.title="MCP Dataverse Server"
LABEL org.opencontainers.image.description="MCP server exposing Microsoft Dataverse Web API as AI-callable tools"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/ dist/
COPY config.example.json ./

ENV NODE_ENV=production
ENV ENVIRONMENT_URL=""
ENV CLIENT_ID=""
ENV CLIENT_SECRET=""
ENV TENANT_ID=""

USER node

CMD ["node", "dist/server.js"]
