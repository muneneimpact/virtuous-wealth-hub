#!/bin/bash

# Production Build Script for cPanel Deployment
# Run: bash deploy.sh

set -e

echo "🚀 Starting Virtuous Deca Build Process..."

# Check Node.js
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "✓ Node.js: $node_version"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build application
echo "🏗️ Building application..."
npm run build

# Check build output
if [ -d "dist" ]; then
    echo "✓ Build successful!"
    echo "📊 Build size:"
    du -sh dist/
else
    echo "✗ Build failed! No dist folder found."
    exit 1
fi

echo "✅ Ready for cPanel deployment!"
echo ""
echo "Next steps:"
echo "1. Ensure .cpanel.yml is present"
echo "2. Commit all changes: git add . && git commit -m 'Build files'"
echo "3. Push to GitHub: git push origin main"
echo "4. Deploy via cPanel Git interface"
