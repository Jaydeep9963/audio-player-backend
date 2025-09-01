# development stage
FROM node:14-alpine as base

WORKDIR /usr/src/app

COPY package.json package-lock.json tsconfig.json ecosystem.config.json ./

COPY ./src ./src

RUN ls -a

RUN npm ci && npm run compile

# production stage
FROM base as production

WORKDIR /usr/prod/app

ENV NODE_ENV=production

COPY package.json package-lock.json ecosystem.config.json ./

RUN npm ci --only=production

COPY --from=base /usr/src/app/dist ./dist