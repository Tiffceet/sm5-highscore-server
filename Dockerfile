# syntax=docker/dockerfile:1

FROM node:18.14.0
ENV NODE_ENV=production
WORKDIR /app

ENV PORT=3001
COPY ["package.json", "package-lock.json*", "./"]

RUN touch alias.json

RUN npm ci

COPY . .

CMD [ "npm", "start"]
