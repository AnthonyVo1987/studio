# Use the official Node.js 20 image as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application's code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
