#!/bin/bash
set -e

cd /usr/src/app

npx sequelize db:migrate

exec "$@"