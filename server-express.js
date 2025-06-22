import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables if dotenv is available
try {
  import('dotenv').then(dotenv => dotenv.config());
} catch (error) {
  console.log('dotenv not available, skipping');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, 'dist/public')));

// Handle API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist/public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
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
          <script>setTimeout(() => { window.location.href="/"; }, 1000);</script>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});