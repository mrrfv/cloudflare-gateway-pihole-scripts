FROM docker.io/node:22.14.0-alpine

WORKDIR /app

# Add project source to image
ADD . /app

# Install project and cron entry
RUN npm ci && echo "0 3 * * 1 /bin/bash /app/update_filter_lists.sh" | crontab -

# Run the command on container startup
ENTRYPOINT ["/usr/sbin/crond", "-l", "2", "-f"]
