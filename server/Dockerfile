# ---------- Stage 1: build client ----------
    FROM node:20-alpine AS client-builder

    ARG VITE_TURNSTILE_SITE_KEY
    ARG VITE_API_URL
    ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
    ENV VITE_API_URL=$VITE_API_URL
    
    WORKDIR /client
    
    COPY client/package.json ./package.json
    RUN npm install
    
    COPY client/ ./
    RUN npm run build
    
    # ---------- Stage 2: server runtime ----------
    FROM node:20-alpine
    
    RUN apk add --no-cache openssl mysql-client
    
    WORKDIR /app
    
    COPY server/package.json ./package.json
    RUN npm install
    
    COPY server/prisma ./prisma
    RUN npx prisma generate
    
    COPY server/src ./src
    COPY server/public ./public
    COPY server/scripts ./scripts
    COPY server/docker-entrypoint.sh ./docker-entrypoint.sh
    
    COPY --from=client-builder /client/dist /client/dist
    
    RUN chmod +x /app/docker-entrypoint.sh
    
    EXPOSE 4000
    
    CMD ["/app/docker-entrypoint.sh"]