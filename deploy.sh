#!/bin/bash
set -e

# Build the client
echo "Building client..."
npm run build

# Ensure the index.html is copied to 200.html for SPA routing
echo "Setting up SPA routing..."
cp -f dist/public/index.html dist/public/200.html

# Start the server
echo "Starting server..."
node server.js