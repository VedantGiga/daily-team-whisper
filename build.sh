#!/bin/bash
set -e

# Build the client
echo "Building client..."
npm run build

# Create a simple index.html in the dist/public directory
echo "Creating index.html..."
cat > dist/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoBrief - Team Summaries</title>
  <link rel="icon" href="/favicon.ico">
  <script type="module" crossorigin src="/assets/index.js"></script>
  <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOL

echo "Build completed successfully!"