import { registerRoutes } from './routes';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
}

// Register all routes
registerRoutes(app).then((server) => {
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

export default app;