import express from 'express';
import path from 'path';

// In production, the server is running from the dist directory
const publicPath = process.env.NODE_ENV === 'production' 
  ? path.resolve('./dist/public')
  : path.resolve('./dist/public');

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