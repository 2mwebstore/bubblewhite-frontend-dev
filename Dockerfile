# --- Build stage -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# NUXT_PUBLIC_* vars get baked into the client bundle at build time, same
# as Vite's VITE_* vars did before — these have to be build ARGs, not just
# runtime env vars, or the client-side bundle won't have them.
ARG NUXT_PUBLIC_API_BASE_URL
ARG NUXT_PUBLIC_SITE_URL
ENV NUXT_PUBLIC_API_BASE_URL=$NUXT_PUBLIC_API_BASE_URL
ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL

RUN npm run build

# --- Run stage ---------------------------------------------------------------
# This is the key deployment-shape change from the old Vite/nginx setup:
# Nuxt SSR needs an actual running Node process to render pages per-request
# (that's the whole point — real HTML per URL, not a static bundle nginx
# just serves as-is). There's no nginx here anymore.
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.output ./.output

# Railway injects PORT at runtime; Nitro's node-server preset reads it
# directly via the PORT env var, no extra config needed.
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
