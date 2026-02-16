#!/bin/bash

if [ "$1" = "" ]; then
  HOUR=${CRON_HOUR:-9}
  MINUTE=${CRON_MINUTE:-9}
  echo "$MINUTE $HOUR * * * root /usr/local/bin/node /app/dist/index.js >/proc/1/fd/1 2>&1" > /etc/cron.d/gh-gl-sync
  chmod 0644 /etc/cron.d/gh-gl-sync
  printenv >> /etc/environment
  echo "Starting cron, running every day at $HOUR:$MINUTE"
  exec cron -f
elif [ "$1" = "once" ]; then
  exec node /app/dist/index.js
else
  exec "$@"
fi