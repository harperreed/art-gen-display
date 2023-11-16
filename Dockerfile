# Use the official Node.js 16 image.
# https://hub.docker.com/_/node
FROM node:16

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Expose port 3000 for the application
EXPOSE 3000

# Run the web service on container startup.
CMD [ "node", "server.js" ]
