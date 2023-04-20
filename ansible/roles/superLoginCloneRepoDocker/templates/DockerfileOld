FROM node:18-alpine3.16

COPY . ./app

WORKDIR ./app

RUN apk update \
  && apk add --no-cache --virtual .gyp python3 make g++ \
  && npm i

EXPOSE 3000

## change to prod
CMD npm run start-superlogin-dev
