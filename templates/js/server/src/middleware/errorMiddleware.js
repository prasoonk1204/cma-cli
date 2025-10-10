// Error handling middleware

// Handle 404 errors for undefined routes
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler - formats and sends error responses
export const errorHandler = (err, req, res, _next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle specific MongoDB/Mongoose errors
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  res.status(statusCode).json({
    message,
    // Include stack trace in development only
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};
