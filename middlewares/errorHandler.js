class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}. See /api-docs for the list of available endpoints.`,
  });
}


const formatFieldError = (e) => {
  if (e.name === 'CastError' && e.kind === 'ObjectId') {
    return `"${e.value}" is not a valid ID for "${e.path}". Make sure you're pasting a real ID from an existing record, not placeholder text.`;
  }
  if (e.name === 'CastError') {
    return `"${e.value}" is not a valid value for "${e.path}".`;
  }
  return e.message;
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fieldMessages = Object.values(err.errors).map(formatFieldError);
    message = fieldMessages.join(' ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = formatFieldError(err);
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `${field} "${value}" is already in use. Please use a different one.`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { ApiError, notFoundHandler, errorHandler };