import app from '../doctor-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/doctor')) {
    req.url = req.url.slice('/_internal/doctor'.length) || '/';
  }
  return app(req, res);
}
