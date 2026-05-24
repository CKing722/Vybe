const { ApiError } = require('../utils/errors');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'route_not_found', `No route for ${req.method} ${req.path}`));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.status || 500;
  const body = {
    error: {
      code: error.code || 'internal_error',
      message: status === 500 ? 'Internal server error' : error.message,
    },
  };

  if (error.details && process.env.NODE_ENV !== 'production') {
    body.error.details = error.details;
  }

  if (status === 500) {
    console.error(error);
  }

  return res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
