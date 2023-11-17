# Use the official Node.js 16 image.
# https://hub.docker.com/_/node
FROM node:21

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

RUN mkdir ./cache

# Expose port 3000 for the application
EXPOSE 8354

# Run the web service on container startup.
CMD [ "node", "app.js" ]
