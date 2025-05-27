# Stage 1: install dependencies and build
FROM node:18-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package definitions and install
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: setup production image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy build artifacts and dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Expose Next.js default port and start
EXPOSE 3000
CMD ["npm", "start"] 