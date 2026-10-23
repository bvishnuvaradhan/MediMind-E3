/**
 * MediMind Safe MongoDB Configuration Validator
 *
 * Enforces database environment boundaries, prevents accidental localhost fallback
 * when a remote/production database is mandated, and guarantees zero secret leakage.
 */

export function validateMongoConfig(uri, env = process.env) {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    throw new Error('Database configuration error: MongoDB URI is missing or empty.');
  }

  const isLocalhost = uri.includes('localhost') || uri.includes('127.0.0.1');
  const isRemote = uri.includes('mongodb+srv://') || (uri.includes('mongodb://') && !isLocalhost && uri.includes('@'));
  const strictRemote = env.STRICT_REMOTE_DB === 'true' || env.NODE_ENV === 'production';
  const allowLocalFallback = env.ALLOW_LOCAL_FALLBACK !== 'false' && env.NODE_ENV !== 'production';

  if (strictRemote && isLocalhost) {
    throw new Error('Database configuration violation: Localhost MongoDB is strictly prohibited when remote database is required.');
  }

  return {
    isLocalhost,
    isRemote,
    strictRemote,
    allowLocalFallback,
  };
}

export function maskMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '<EMPTY>';
  try {
    const isSrv = uri.startsWith('mongodb+srv://');
    const dummyProto = 'http://';
    const parsed = new URL(uri.replace(/^mongodb\+srv:\/\//, dummyProto).replace(/^mongodb:\/\//, dummyProto));
    const scheme = isSrv ? 'mongodb+srv://' : 'mongodb://';
    return `${scheme}***:***@${parsed.host}${parsed.pathname || ''}`;
  } catch {
    return uri.includes('mongodb+srv') ? 'mongodb+srv://***@<remote-host>' : 'mongodb://***@<host>';
  }
}
