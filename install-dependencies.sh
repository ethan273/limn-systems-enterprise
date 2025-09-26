#!/bin/bash

# Install the only missing dependency for optimal tRPC setup

echo "📦 Installing Missing Dependencies for Limn Systems Enterprise"
echo "=============================================================="
echo ""

# Navigate to project directory
cd /Users/eko3/limn-systems-enterprise

echo "Installing superjson for better data serialization..."
npm install superjson

echo ""
echo "✅ Installation Complete!"
echo ""
echo "Optional: Install development helpers (recommended):"
echo "npm install --save-dev @types/pg"
echo ""
echo "🚀 You're ready to build! Run: ./start-development.sh"
