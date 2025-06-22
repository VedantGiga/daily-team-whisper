import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
const staticPath = path.join(__dirname, '../dist/public');
app.use(express.static(staticPath));

// API routes would go here
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  const fallbackPath = path.join(__dirname, 'fallback-index.html');
  
  // Check if index.html exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (fs.existsSync(fallbackPath)) {
    // Use fallback if main index.html is missing
    res.sendFile(fallbackPath);
  } else {
    res.status(200).send('<html><body><h1>AutoBrief</h1><p>Loading application...</p><script>window.location.href="/";</script></body></html>');
  }
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Serving static files from: ${staticPath}`);
});