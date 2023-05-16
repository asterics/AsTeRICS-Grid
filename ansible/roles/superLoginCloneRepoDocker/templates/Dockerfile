FROM node:18-alpine3.16

COPY ./package.json ./app/
COPY ./yarn.lock ./app/

WORKDIR ./app

RUN apk update \
  && apk add --no-cache --virtual .gyp python3 make g++ \
  && yarn install

COPY . .

EXPOSE 3000

CMD npm run start-auth
