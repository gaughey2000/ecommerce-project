const logger = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📦 ${req.method} ${req.originalUrl}`);
    }
    next();
  };
  
  module.exports = logger;