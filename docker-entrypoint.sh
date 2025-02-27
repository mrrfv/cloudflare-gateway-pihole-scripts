#!/bin/sh

# Add cron entry
echo "$CRON_SCHEDULE /usr/local/bin/npm start --prefix /app/" | crontab -

# Start crond
/usr/sbin/crond -l 2 -f
