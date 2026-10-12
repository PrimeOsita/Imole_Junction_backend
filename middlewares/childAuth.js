const ChildToken = require('../models/ChildToken');
const { hashToken } = require('../utils/tokenGenerator');
const { ApiError } = require('./errorHandler');

async function childAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, rawToken] = header.split(' ');

    if (scheme !== 'Bearer' || !rawToken) {
      throw new ApiError(401, 'Missing or malformed Authorization header');
    }

    const tokenHash = hashToken(rawToken);
    const childToken = await ChildToken.findOne({ tokenHash, revokedAt: null });

    if (!childToken) {
      throw new ApiError(401, 'Invalid or revoked token');
    }

    req.childId = childToken.childId;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { childAuth };