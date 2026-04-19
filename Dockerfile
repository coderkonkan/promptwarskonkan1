# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose the port Cloud Run expects
ENV PORT=8080
EXPOSE 8080

# Command to run the app
CMD ["node", "index.js"]
