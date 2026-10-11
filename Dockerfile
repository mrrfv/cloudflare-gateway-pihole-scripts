ARG NODE_VERSION=lts

FROM docker.io/node:${NODE_VERSION}-alpine

WORKDIR /app

# Add project source to image
ADD . /app

# Install project dependencies and set permissions
RUN apk add --no-cache tzdata && npm ci && chmod +x /app/docker-entrypoint.sh \
    && chown -R node:node /app

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Run the bundled cron; override to drive the image from an external scheduler
# e.g. `docker run <image> npm start --prefix /app/`
CMD ["/usr/sbin/crond", "-f", "-l", "2"]
