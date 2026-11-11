import app from '../family-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/family')) {
    req.url = req.url.slice('/_internal/family'.length) || '/';
  }
  return app(req, res);
}
