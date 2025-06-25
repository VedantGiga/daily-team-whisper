import { registerRoutes } from './routes';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { 
  securityHeaders, 
  rateLimiter, 
  apiRateLimiter, 
  requestLogger, 
  errorHandler, 
  notFoundHandler 
} from './middleware/security';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(securityHeaders);
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);
app.use('/api', apiRateLimiter);

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Explicitly handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/favicon.ico'));
});

// Serve the root path
if (process.env.NODE_ENV === 'development') {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './fallback-index.html'));
  });
} else {
  // In production, serve the built frontend
  app.get('/', (req, res) => {
    const indexPath = path.join(process.cwd(), 'dist/public/index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(404).json({ error: 'Frontend not found. Make sure the build completed successfully.' });
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: "Daily Team Whisper API", 
    status: "running",
    endpoints: {
      integrations: "/api/integrations",
      activities: "/api/activities",
      summaries: "/api/summaries",
      ai: "/api/ai/*"
    }
  });
});

// Cron status endpoint (directly in index.ts for immediate availability)
app.get('/api/cron-check', (req, res) => {
  // Calculate next run time
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(20, 0, 0, 0); // 8 PM
  
  // If it's already past 8 PM, schedule for tomorrow
  if (now.getHours() >= 20) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  const hoursUntilNextRun = Math.floor(timeUntilNextRun / (1000 * 60 * 60));
  const minutesUntilNextRun = Math.floor((timeUntilNextRun % (1000 * 60 * 60)) / (1000 * 60));
  
  res.json({
    currentTime: now.toISOString(),
    nextRunTime: nextRun.toISOString(),
    timeUntilNextRun: {
      hours: hoursUntilNextRun,
      minutes: minutesUntilNextRun,
      formatted: `${hoursUntilNextRun}h ${minutesUntilNextRun}m`
    },
    schedule: '0 20 * * *', // 8 PM daily
    isActive: true
  });
});

// Manual trigger endpoint (directly in index.ts for immediate availability)
app.post('/api/run-cron', async (req, res) => {
  try {
    console.log('Manually triggering daily summary generation...');
    
    // Import CronService dynamically
    const { CronService } = await import('./services/cronService');
    
    // Run the daily summary generation
    await CronService.generateDailySummaries();
    
    res.json({ 
      success: true, 
      message: 'Daily summary generation triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering daily summary generation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to trigger daily summary generation',
      message: error.message
    });
  }
});

// In production, serve React application assets
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist/public');
  console.log('🚀 Serving React app from:', distPath);
  
  // Serve static assets (JS, CSS, images)
  app.use('/assets', express.static(path.join(distPath, 'assets')));
  app.use(express.static(distPath, { index: false }));
}

// Register all routes
registerRoutes(app).then((server) => {
  const port = process.env.PORT || 5000;
  
  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Global error handlers (moved after SPA handler)
// These will be set up after routes are registered

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;