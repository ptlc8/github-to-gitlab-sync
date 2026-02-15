# Build stage
FROM node:24-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build


# Production image
FROM node:24-slim AS production

WORKDIR /app

# Install git for cloning and pushing repositories
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy built files from the build stage
COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]
