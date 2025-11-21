#!/bin/bash
# Render build script for backend

echo "🔨 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🏗️ Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migration:run:linux || echo "⚠️ Migration failed, continuing..."

echo "✅ Build complete!"

