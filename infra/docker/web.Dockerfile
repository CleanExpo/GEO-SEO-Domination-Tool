# syntax=docker/dockerfile:1.7
# --- deps stage --------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
# Copy only what's needed to install web-app deps
COPY geo-seo-domination-tool/web-app/package.json geo-seo-domination-tool/web-app/package-lock.json* ./web-app/
RUN set -eux; \
  cd web-app; \
  (npm ci || npm i)

# --- build stage -------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
# Bring in installed node_modules and full source
COPY --from=deps /app/web-app/node_modules ./web-app/node_modules
COPY geo-seo-domination-tool/web-app ./web-app
# Build Next.js (standalone output)
RUN set -eux; \
  cd web-app; \
  npm run build

# --- runtime stage -----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
# Add a tiny HTTP client for healthcheck
RUN apk add --no-cache wget
# Copy Next.js standalone server output
# Standalone contains server.js and minimal node_modules
COPY --from=build /app/web-app/.next/standalone ./
# Static assets
COPY --from=build /app/web-app/.next/static ./.next/static
# Public folder
COPY --from=build /app/web-app/public ./public
# Expose Next.js port (reverse proxy connects here)
EXPOSE 3000
# Basic healthcheck against the app's health endpoint if present
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
# Launch the Next.js standalone server
CMD ["node", "server.js"]
