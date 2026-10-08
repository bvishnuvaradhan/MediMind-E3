export const forwardRequest = (targetServiceUrl) => {
  return async (req, res, next) => {
    try {
      const url = `${targetServiceUrl}${req.originalUrl}`;

      const headers = { ...req.headers };
      delete headers.host;
      delete headers['content-length'];

      // Ensure correlation ID is forwarded
      if (req.requestId) {
        headers['x-request-id'] = req.requestId;
      }

      // Ensure internal secret is forwarded
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
      const internalKey = process.env.INTERNAL_SERVICE_KEY || internalSecret;
      headers['x-internal-service-secret'] = internalSecret;
      headers['X-Internal-Service-Key'] = internalKey;

      // Forward trusted identity if authenticated
      if (req.user) {
        headers['x-user-id'] = req.user.userId;
        headers['x-user-role'] = req.user.role;
        headers['x-user-reference-id'] = req.user.referenceId || '';
        if (req.user.familyId) {
          headers['x-family-id'] = req.user.familyId;
          headers['x-user-family-id'] = req.user.familyId;
        } else {
          delete headers['x-family-id'];
          delete headers['x-user-family-id'];
        }
        if (req.user.doctorId) {
          headers['x-doctor-id'] = req.user.doctorId;
          headers['x-user-doctor-id'] = req.user.doctorId;
        } else {
          delete headers['x-doctor-id'];
          delete headers['x-user-doctor-id'];
        }
        if (req.user.departmentId) {
          headers['x-department-id'] = req.user.departmentId;
          headers['x-user-department-id'] = req.user.departmentId;
        } else {
          delete headers['x-department-id'];
          delete headers['x-user-department-id'];
        }
        if (req.user.hospitalId) {
          headers['x-hospital-id'] = req.user.hospitalId;
          headers['x-user-hospital-id'] = req.user.hospitalId;
        } else {
          delete headers['x-hospital-id'];
          delete headers['x-user-hospital-id'];
        }
      } else {
        delete headers['x-user-id'];
        delete headers['x-user-role'];
        delete headers['x-user-reference-id'];
        delete headers['x-family-id'];
        delete headers['x-user-family-id'];
        delete headers['x-doctor-id'];
        delete headers['x-user-doctor-id'];
        delete headers['x-department-id'];
        delete headers['x-user-department-id'];
        delete headers['x-hospital-id'];
        delete headers['x-user-hospital-id'];
      }

      const options = {
        method: req.method,
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        if (req.headers['content-type']?.includes('application/json') && req.body && Object.keys(req.body).length > 0) {
          options.body = JSON.stringify(req.body);
          headers['content-type'] = 'application/json';
        } else if (req.headers['content-type']?.includes('multipart/form-data')) {
          options.body = req;
          options.duplex = 'half';
        } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
          options.body = JSON.stringify(req.body);
        }
      }

      const response = await fetch(url, options);

      // Copy response headers
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      const data = await response.json().catch(() => null);

      res.status(response.status);
      if (data) {
        res.json(data);
      } else {
        res.end();
      }
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          message: 'Downstream service request timed out',
        });
      }

      if (
        error.cause?.code === 'ECONNREFUSED' ||
        error.code === 'ECONNREFUSED' ||
        error.cause?.code === 'ENOTFOUND' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('fetch failed')
      ) {
        return res.status(503).json({
          success: false,
          message: 'Downstream service temporarily unavailable',
        });
      }

      next(error);
    }
  };
};
