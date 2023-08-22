FROM alpine:latest

RUN apk add nodejs npm

WORKDIR /app

COPY package.json package.json

RUN npm install

COPY . .

# EXPOSE 8000

ENV NODE_ENV=docker

CMD ["node", "index.js"]