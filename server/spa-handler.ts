import express from 'express';
import path from 'path';

// In production, serve the built frontend files
const publicPath = path.resolve(process.cwd(), 'dist/public');

export function setupSpaHandler(app: express.Express) {
  // Catch-all route for React SPA (static files already served in main server)
  app.get('*', (req, res, next) => {
    // Skip API routes and static assets
    if (req.path.startsWith('/api/') || req.path === '/health' || req.path.startsWith('/assets/') || req.path.includes('.')) {
      return next();
    }
    
    // Send the React app index.html for all other routes
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving React app:', err);
        res.status(404).send('React app not found');
      }
    });
  });
}