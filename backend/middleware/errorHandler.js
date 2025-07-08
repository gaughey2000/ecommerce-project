
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err); 

  const statusCode = err.status || 500;
  const response = {
    error: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;