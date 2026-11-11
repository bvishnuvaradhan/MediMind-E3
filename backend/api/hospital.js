import app from '../hospital-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/hospital')) {
    req.url = req.url.slice('/_internal/hospital'.length) || '/';
  }
  return app(req, res);
}
