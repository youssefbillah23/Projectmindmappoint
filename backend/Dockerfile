FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --production=false

# Generate Prisma client
RUN npx prisma generate

# Build
COPY tsconfig.json ./
COPY src ./src/
RUN npx tsc

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/package.json /app/package-lock.json ./
COPY --from=base /app/node_modules ./node_modules/
COPY --from=base /app/dist ./dist/
COPY --from=base /app/prisma ./prisma/

# Create audio temp directory
RUN mkdir -p /tmp/audio

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
