ARG NODE_VERSION=lts

FROM docker.io/node:${NODE_VERSION}-alpine

WORKDIR /app

# Add project source to image
ADD . /app

# Install project dependencies and set permissions
RUN apk add --no-cache tzdata && npm ci && chmod +x /app/docker-entrypoint.sh

# Run the entrypoint script on container startup
ENTRYPOINT ["/app/docker-entrypoint.sh"]
