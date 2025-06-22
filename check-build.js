const fs = require('fs');
const path = require('path');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found!');
  process.exit(1);
}

// Check if public directory exists
const publicPath = path.join(distPath, 'public');
if (!fs.existsSync(publicPath)) {
  console.error('❌ dist/public directory not found!');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(publicPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in dist/public!');
} else {
  console.log('✅ index.html found in dist/public');
}

// Check if production server exists
const serverPath = path.join(distPath, 'production-server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ production-server.js not found in dist!');
} else {
  console.log('✅ production-server.js found in dist');
}

// Check if assets directory exists
const assetsPath = path.join(publicPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ assets directory not found in dist/public!');
} else {
  console.log('✅ assets directory found in dist/public');
  
  // List files in assets directory
  const assetFiles = fs.readdirSync(assetsPath);
  console.log(`Found ${assetFiles.length} files in assets directory:`);
  assetFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

console.log('\nBuild check completed!');