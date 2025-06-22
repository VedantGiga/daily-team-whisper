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
  
  try {
    // Try to send the index.html file
    res.sendFile(indexPath);
  } catch (error) {
    // If index.html doesn't exist, send a simple HTML response
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AutoBrief - Team Summaries</title>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h1>AutoBrief</h1>
          <p>Loading application...</p>
          <script>window.location.href="/";</script>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Serving static files from: ${staticPath}`);
});