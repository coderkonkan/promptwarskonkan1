FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# First copy only package files to leverage Docker caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["node", "server.js"]
