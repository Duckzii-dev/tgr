FROM node:20-alpine

WORKDIR /app

ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm run build && npx vite preview --host 0.0.0.0 --port 5173"]