# Stage 1: Build the frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ .

# Build the frontend
RUN npm run build

# Stage 2: Setup the backend and final image
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install --production

# Copy backend source code
COPY backend/ .

# Copy built frontend assets from the builder stage
# The server expects them at ../frontend/dist relative to server.js (which is in /app/backend)
# So we need to put them in /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
