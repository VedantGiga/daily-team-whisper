import express from 'express';
import path from 'path';

// In production, serve the built frontend files
const publicPath = path.resolve(process.cwd(), 'dist/public');

export function setupSpaHandler(app: express.Express) {
  // Serve static files
  app.use(express.static(publicPath));
  
  // Catch-all route for SPA
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    
    // Send the SPA index.html for all other routes
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}