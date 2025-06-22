import { registerRoutes } from './routes';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Register all routes
registerRoutes(app).then((server) => {
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

export default app;