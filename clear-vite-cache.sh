#!/bin/bash
# Clear Vite Cache Script
# Run this script to fix module export errors

echo "🧹 Clearing Vite Cache..."

# Check if frontend directory exists
if [ -d "frontend" ]; then
    # Clear Vite cache
    if [ -d "frontend/node_modules/.vite" ]; then
        echo "   Removing frontend/node_modules/.vite..."
        rm -rf frontend/node_modules/.vite
        echo "   ✅ Vite cache cleared!"
    else
        echo "   ℹ️  No Vite cache found (already clean)"
    fi
    
    # Clear dist folder if it exists
    if [ -d "frontend/dist" ]; then
        echo "   Removing frontend/dist..."
        rm -rf frontend/dist
        echo "   ✅ Dist folder cleared!"
    fi
    
    echo ""
    echo "✨ Cache cleared successfully!"
    echo ""
    echo "Next steps:"
    echo "1. cd frontend"
    echo "2. npm run dev"
    echo "3. Hard refresh your browser (Ctrl+Shift+R)"
    
else
    echo "❌ Error: frontend directory not found!"
    echo "   Make sure you're running this script from the project root."
    exit 1
fi
