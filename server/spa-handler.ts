import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, '../dist/public');

export function setupSpaHandler(app: express.Express) {
  // Serve static files
  app.use(express.static(publicPath));
  
  // Catch-all route for SPA
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Send the SPA index.html for all other routes
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}