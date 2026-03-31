# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Compile drizzle.config.ts to JavaScript so it can be used at runtime
RUN npx tsc drizzle.config.ts --outDir ./ --module commonjs --target es2020
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
# Copy built artifacts (the whole dist folder)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
# Copy drizzle config (compiled to JS) and migrations
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js
COPY src/database/migrations ./migrations

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the app – note the correct path (NestJS outputs to dist/src/main.js)
CMD ["node", "dist/src/main.js"]