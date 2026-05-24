const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/errors');

function validate(validations) {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      return next(
        badRequest('Request validation failed', {
          fields: errors.array({ onlyFirstError: true }).map((error) => ({
            field: error.path,
            message: error.msg,
          })),
        })
      );
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { validate };

