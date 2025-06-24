// Production server that imports and runs the TypeScript server
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting Daily Team Whisper production server...');
console.log('📁 Working directory:', __dirname);
console.log('🌍 Environment:', process.env.NODE_ENV);

// Start the TypeScript server using tsx
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  console.log(`🔄 Server process exited with code ${code} and signal ${signal}`);
  if (code !== 0) {
    console.error('❌ Server exited with non-zero code');
    process.exit(code || 1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});