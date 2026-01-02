# Use the official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (ignore peer dependency conflicts)
RUN npm install --legacy-peer-deps

# Copy all frontend files
COPY . .

# Build the React app
RUN npm run build

# Serve the build folder with a simple static server
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
