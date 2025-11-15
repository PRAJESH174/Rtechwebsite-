# Container image for Rtechwebsite-
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Copy app source
COPY . .

# Expose default port
ENV PORT=3000
EXPOSE 3000

# Healthcheck (simple)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Run the server
CMD ["node", "server.cjs"]
