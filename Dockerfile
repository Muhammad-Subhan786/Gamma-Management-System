FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd /app/server && npm install
RUN cd /app/client && npm install

# Copy source code
COPY . .

# Build React app
RUN cd /app/client && npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 