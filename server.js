import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Log middleware to debug requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, 'dist/public')));

// Explicitly serve assets directory
app.use('/assets', express.static(path.join(__dirname, 'dist/public/assets')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Send the SPA index.html for all other routes
  const indexPath = path.join(__dirname, 'dist/public/index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('Serving index.html');
    res.sendFile(indexPath);
  } else {
    console.error('index.html not found at:', indexPath);
    // List files in the dist directory to debug
    try {
      const files = fs.readdirSync(path.join(__dirname, 'dist/public'));
      console.log('Files in dist/public:', files);
    } catch (err) {
      console.error('Error reading dist/public directory:', err);
    }
    
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AutoBrief</title>
        </head>
        <body>
          <div id="root"></div>
          <script>
            // Try to load the main script
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/assets/index.js';
            document.body.appendChild(script);
          </script>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'dist/public')}`);
});