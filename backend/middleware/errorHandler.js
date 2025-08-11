const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  const status = err.status || 500;
  const payload = {
    code: err.code || (status === 400 ? 'BAD_REQUEST'
                : status === 401 ? 'UNAUTHORIZED'
                : status === 403 ? 'FORBIDDEN'
                : status === 404 ? 'NOT_FOUND'
                : 'INTERNAL_ERROR'),
    message: err.message || 'Internal Server Error',
  };

  if (err.details) payload.details = Array.isArray(err.details) ? err.details : [String(err.details)];
  if (process.env.NODE_ENV === 'development' && err.stack) payload.stack = err.stack;

  res.status(status).json(payload);
};

module.exports = errorHandler;