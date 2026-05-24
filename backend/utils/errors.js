class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function badRequest(message, details) {
  return new ApiError(400, 'bad_request', message, details);
}

function unauthorized(message = 'Authentication required') {
  return new ApiError(401, 'unauthorized', message);
}

function forbidden(message = 'Not allowed') {
  return new ApiError(403, 'forbidden', message);
}

function notFound(message = 'Not found') {
  return new ApiError(404, 'not_found', message);
}

function conflict(message, details) {
  return new ApiError(409, 'conflict', message, details);
}

function serviceUnavailable(message, details) {
  return new ApiError(503, 'service_unavailable', message, details);
}

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serviceUnavailable,
};
