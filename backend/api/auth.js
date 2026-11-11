import app from '../auth-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/auth')) {
    req.url = req.url.slice('/_internal/auth'.length) || '/';
  }
  return app(req, res);
}
