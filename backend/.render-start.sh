#!/bin/bash
# Render start script for backend

echo "🚀 Starting UrutiX Backend..."

# Run migrations before starting (optional, can be done via build script)
# npm run migration:run:linux

# Start the application
node dist/main.js

