#!/bin/sh

# Install the crontab only when this container is actually going to run cron.
# busybox crontab also refuses to run as a non-root user, so this keeps it
# from erroring on a non-root one-shot command.
case "$1" in
  crond | /usr/sbin/crond)
    echo "$CRON_SCHEDULE /usr/local/bin/npm start --prefix /app/" | crontab -
    echo "Starting crond..."
    ;;
esac

"$@"
