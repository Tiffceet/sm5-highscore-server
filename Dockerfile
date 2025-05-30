ARG BUN_VERSION=1.2.15
FROM oven/bun:${BUN_VERSION}

ENV NODE_ENV=production
WORKDIR /app

COPY package.json bun.lockb ./

RUN touch alias.json

RUN bun install

COPY . .

CMD [ "bun", "start" ]
