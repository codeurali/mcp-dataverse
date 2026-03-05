FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled server (src is kept private — distributed via npm)
COPY dist ./dist

ENTRYPOINT ["node", "dist/server.js"]
