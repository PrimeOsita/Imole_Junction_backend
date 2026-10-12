const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('./errorHandler');

function parentAuth(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Missing or malformed Authorization header');
    }

    const payload = jwt.verify(token, env.parentJwtSecret);

    if (payload.type !== 'parent') {
      throw new ApiError(401, 'Invalid authentication token.');
    }

    req.parentId = payload.id;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { parentAuth };