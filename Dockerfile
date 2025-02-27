FROM docker.io/node:22.14.0-alpine

WORKDIR /app

# Add project source to image
ADD . /app

# Install project dependencies
RUN npm ci

# Run the entrypoint script on container startup
ENTRYPOINT ["/app/docker-entrypoint.sh"]
