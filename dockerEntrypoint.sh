#!/bin/bash
set -e

npx run sequelize db:migrate

exec "$@"