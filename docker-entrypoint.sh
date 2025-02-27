#!/bin/sh

# Add cron entry
echo "$CRON_SCHEDULE /bin/sh /app/update_filter_lists.sh" | crontab -

# Start crond
/usr/sbin/crond -l 2 -f
