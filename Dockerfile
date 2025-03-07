# Use the official Node.js image
FROM node:16-slim

# Set default value for NODE_ENV to 'development'
ARG NODE_ENV=development

# Set the environment variable to NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Install ffmpeg dependency
RUN apt-get update && apt-get install -y \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory for the app
WORKDIR /app

# Copy the package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the application port
EXPOSE 8000

# Use nodemon to automatically restart on code changes during development
CMD ["npm", "start"]
