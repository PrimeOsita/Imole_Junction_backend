const { ApiError } = require('./errorHandler');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('. ');
      return next(new ApiError(400, message));
    }

    req.body = result.data;
    next();
  };
}

module.exports = { validate };