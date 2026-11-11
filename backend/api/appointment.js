import app from '../appointment-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/appointment')) {
    req.url = req.url.slice('/_internal/appointment'.length) || '/';
  }
  return app(req, res);
}
