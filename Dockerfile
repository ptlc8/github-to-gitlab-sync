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

# Install git for cloning and pushing repositories and cron for scheduling tasks
RUN apt-get update && apt-get install -y cron git && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh ./

# Copy built files from the build stage
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

ENTRYPOINT ["bash", "entrypoint.sh"]