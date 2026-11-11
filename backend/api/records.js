import app from '../medical-record-service/src/app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/_internal/records')) {
    req.url = req.url.slice('/_internal/records'.length) || '/';
  }
  return app(req, res);
}
