# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS base

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN set -eux; \
    if [ -f package-lock.json ]; then npm ci --only=production; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --prod; \
    elif [ -f yarn.lock ]; then yarn install --production; \
    else npm i --only=production; fi

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]


