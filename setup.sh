#!/bin/bash

# Employee Attendance System Setup Script
echo "🚀 Setting up Employee Attendance System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Create environment file
echo "🔧 Setting up environment variables..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env file"
    echo "⚠️  Please edit server/.env with your MongoDB connection string"
else
    echo "✅ server/.env already exists"
fi

# Check if MongoDB is running locally
echo "🗄️  Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running locally"
    else
        echo "⚠️  MongoDB is installed but not running"
        echo "   Start MongoDB with: mongod"
    fi
else
    echo "⚠️  MongoDB is not installed locally"
    echo "   Consider using MongoDB Atlas for cloud database"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your MongoDB connection string"
echo "2. Start MongoDB (if using local instance)"
echo "3. Run: npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "Optional:"
echo "- Run 'cd server && npm run seed' to populate sample data"
echo "- Check README.md for detailed instructions"
echo "- Check DEPLOYMENT.md for deployment guide" 