// Custom error handler middleware
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  // Log error in production
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${new Date().toISOString()}] Error:`, {
      status,
      message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Validation error handler
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    req.validatedData = value;
    next();
  };
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  validateRequest,
  asyncHandler
};
