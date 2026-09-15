FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
EXPOSE 4000
CMD ["node", "src/index.js"]