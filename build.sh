#!/bin/bash

echo "🚀 Starting optimized build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --production=false

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --production=false
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install --production=false

# Build React app
echo "🔨 Building React app..."
npm run build
cd ..

echo "✅ Build completed successfully!" 