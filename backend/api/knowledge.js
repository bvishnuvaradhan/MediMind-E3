import app from '../knowledge-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/knowledge')) {
    req.url = req.url.slice('/_internal/knowledge'.length) || '/';
  }
  return app(req, res);
}
