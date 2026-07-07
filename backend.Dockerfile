FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci

COPY backend/src ./src
COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./

RUN npx prisma generate

RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
