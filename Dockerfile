FROM node:8-alpine

RUN apk add --no-cache \
  make \
  python

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package*.json package-lock.json ./
RUN npm install
COPY . ./

USER node

CMD ["node", "src/server.js"]
