# ---- Dependencies ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json ./
# npm install (not ci, no committed lock) so the Linux builder resolves and fetches
# the correct platform-specific binaries (next-swc, tailwind oxide, etc.).
RUN npm install --no-audit --no-fund

# ---- Build ----
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The API is now inside this app (same-origin /api), so no external API URL is needed.
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# ---- Runtime (Next.js standalone) ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Bind to all interfaces (Next standalone defaults to localhost, which Render cannot reach -> 502).
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# server.js honours $PORT (Render sets it) and $HOSTNAME.
ENTRYPOINT ["sh", "-c", "node server.js"]
