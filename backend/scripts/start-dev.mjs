import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const services = [
  { name: 'Auth Service', path: 'auth-service', port: 5001, color: '\x1b[34m' },
  { name: 'Family Service', path: 'family-service', port: 5002, color: '\x1b[32m' },
  { name: 'Hospital Service', path: 'hospital-service', port: 5003, color: '\x1b[35m' },
  { name: 'Doctor Service', path: 'doctor-service', port: 5004, color: '\x1b[33m' },
  { name: 'Appointment Service', path: 'appointment-service', port: 5005, color: '\x1b[32m' },
  { name: 'Medical Record Service', path: 'medical-record-service', port: 5006, color: '\x1b[35m' },
  { name: 'Knowledge Service', path: 'knowledge-service', port: 5008, color: '\x1b[34m' },
  { name: 'API Gateway', path: 'api-gateway', port: 5000, color: '\x1b[36m' },
];

const resetColor = '\x1b[0m';
const processes = [];

console.log('====================================================');
console.log('Starting MediMind Implemented Backend Services (Dev)');
console.log('====================================================\n');

for (const svc of services) {
  const child = spawn('node', ['server.js'], {
    cwd: path.resolve(rootDir, svc.path),
    env: { ...process.env },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().trimEnd().split('\n');
    for (const line of lines) {
      console.log(`${svc.color}[${svc.name}]${resetColor} ${line}`);
    }
  });

  child.stderr.on('data', (chunk) => {
    const lines = chunk.toString().trimEnd().split('\n');
    for (const line of lines) {
      console.error(`${svc.color}[${svc.name} ERROR]${resetColor} ${line}`);
    }
  });

  child.on('close', (code) => {
    console.log(`${svc.color}[${svc.name}]${resetColor} Exited with code ${code}`);
  });

  processes.push(child);
}

const shutdown = () => {
  console.log('\nShutting down all MediMind backend microservices...');
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
