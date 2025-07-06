const errorHandler = (err, req, res, next) => {
  console.error('💥 Error:', err.stack || err.message);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message || 'Unexpected error',
  });
};

module.exports = errorHandler;