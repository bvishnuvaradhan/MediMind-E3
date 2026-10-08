import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');

const services = [
  { name: 'Auth Service', dir: path.resolve(backendDir, 'auth-service'), cmd: 'node', args: ['server.js'], port: 5001, color: '\x1b[34m' },
  { name: 'Family Service', dir: path.resolve(backendDir, 'family-service'), cmd: 'node', args: ['server.js'], port: 5002, color: '\x1b[32m' },
  { name: 'Hospital Service', dir: path.resolve(backendDir, 'hospital-service'), cmd: 'node', args: ['server.js'], port: 5003, color: '\x1b[35m' },
  { name: 'Doctor Service', dir: path.resolve(backendDir, 'doctor-service'), cmd: 'node', args: ['server.js'], port: 5004, color: '\x1b[33m' },
  { name: 'Appointment Service', dir: path.resolve(backendDir, 'appointment-service'), cmd: 'node', args: ['server.js'], port: 5005, color: '\x1b[32m' },
  { name: 'Medical Record Service', dir: path.resolve(backendDir, 'medical-record-service'), cmd: 'node', args: ['server.js'], port: 5006, color: '\x1b[35m' },
  { name: 'Knowledge Service', dir: path.resolve(backendDir, 'knowledge-service'), cmd: 'node', args: ['server.js'], port: 5008, color: '\x1b[34m' },
  { name: 'AI Prediction Service', dir: path.resolve(rootDir, 'ai-prediction-service'), cmd: 'python', args: ['-m', 'uvicorn', 'app.main:app', '--port', '5007'], port: 5007, color: '\x1b[31m' },
  { name: 'API Gateway', dir: path.resolve(backendDir, 'api-gateway'), cmd: 'node', args: ['server.js'], port: 5000, color: '\x1b[36m' },
  { name: 'Frontend (Vite)', dir: path.resolve(rootDir, 'frontend'), cmd: 'npx', args: ['vite', '--port', '5173'], port: 5173, color: '\x1b[95m' },
];

const resetColor = '\x1b[0m';
const processes = [];

console.log('================================================================');
console.log('  MEDIMIND COMPLETE LIVE DEMO SERVICE LAUNCHER');
console.log('  Spinning up 8 Microservices + API Gateway + AI Service + Frontend');
console.log('================================================================\n');

for (const svc of services) {
  const child = spawn(svc.cmd, svc.args, {
    cwd: svc.dir,
    env: { ...process.env, PORT: svc.port ? svc.port.toString() : undefined },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().trimEnd().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`${svc.color}[${svc.name}]${resetColor} ${line}`);
    }
  });

  child.stderr.on('data', (chunk) => {
    const lines = chunk.toString().trimEnd().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`${svc.color}[${svc.name} LOG]${resetColor} ${line}`);
    }
  });

  child.on('close', (code) => {
    console.log(`${svc.color}[${svc.name}]${resetColor} Process exited with code ${code}`);
  });

  processes.push(child);
}

// Perform health polling after 5 seconds
setTimeout(async () => {
  console.log('\n--- Checking Initial Health Status ---');
  for (const svc of services) {
    try {
      const checkUrl = svc.port === 5173 ? 'http://localhost:5173/' : `http://localhost:${svc.port}/health`;
      const res = await fetch(checkUrl, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 200) {
        console.log(`  \x1b[32m✓\x1b[0m ${svc.name} is ONLINE on :${svc.port}`);
      } else {
        console.log(`  \x1b[33m?\x1b[0m ${svc.name} returned status ${res.status}`);
      }
    } catch {
      console.log(`  \x1b[33m...\x1b[0m ${svc.name} is starting up on :${svc.port}...`);
    }
  }
  console.log('\nPress Ctrl+C to stop all services.\n');
}, 6000);

const shutdown = () => {
  console.log('\nGracefully shutting down all MediMind services...');
  for (const proc of processes) {
    try {
      proc.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
