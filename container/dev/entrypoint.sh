#!/bin/sh
set -e

yarn install --frozen-lockfile
yarn build
npm run start-auth &

exec npm start
