FROM node:24-slim
WORKDIR /app

COPY package*.json prisma.config.ts ./
COPY src/database/prisma ./src/database/prisma
RUN npm ci

COPY . .
EXPOSE 8787

CMD ["sh", "-c", "npx wrangler d1 migrations apply kyc-db --local && npx wrangler dev --ip 0.0.0.0 --port 8787"]