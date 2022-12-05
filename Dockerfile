# base node image
FROM node:18-bullseye-slim as base

# Install openssl for Prisma and curl for pnpm
RUN apt-get update && apt-get install -y openssl curl
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

FROM base

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install all node_modules, including dev dependencies
RUN pnpm fetch
RUN pnpm install --prefer-offline

# Build
# If we're using Prisma, uncomment to cache the prisma schema
# ADD prisma .
# RUN npx prisma generate
RUN pnpm run build

ADD . .

CMD ["pnpm", "run", "start"]