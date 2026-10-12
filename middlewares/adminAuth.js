// const jwt = require('jsonwebtoken');
// const { env } = require('../config/env');
// const { ApiError } = require('./errorHandler');

// // Usage: adminAuth() lets any admin through, adminAuth('super_admin')
// // restricts the route to that role only.
// function adminAuth(...allowedRoles) {
//   return (req, res, next) => {
//     try {
//       const [scheme, token] = (req.headers.authorization || '').split(' ');

//       if (scheme !== 'Bearer' || !token) {
//         throw new ApiError(401, 'Missing or malformed Authorization header');
//       }

//       const payload = jwt.verify(token, env.adminJwtSecret);

//       if (payload.type !== 'admin') {
//         throw new ApiError(401, 'Invalid authentication token.');
//       }

//       if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
//         throw new ApiError(403, 'You do not have permission to do this.');
//       }

//       req.adminId = payload.id;
//       req.adminRole = payload.role;
//       next();
//     } catch (err) {
//       next(err);
//     }
//   };
// }

// module.exports = { adminAuth };



const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { env } = require('../config/env');
const { ApiError } = require('./errorHandler');

// Usage: adminAuth() lets any active admin through, adminAuth('super_admin')
// restricts the route to that role only. The role and active flag are read
// from the database on every request, so deactivating an admin or changing
// their role takes effect immediately instead of when their token expires.
function adminAuth(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const [scheme, token] = (req.headers.authorization || '').split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw new ApiError(401, 'Missing or malformed Authorization header');
      }

      const payload = jwt.verify(token, env.adminJwtSecret);

      if (payload.type !== 'admin') {
        throw new ApiError(401, 'Invalid authentication token.');
      }

      const admin = await Admin.findById(payload.id).select('role isActive');

      // "=== false" on purpose: admins created before this field existed have
      // no isActive value, and they must still be allowed in.
      if (!admin || admin.isActive === false) {
        throw new ApiError(401, 'This admin account is no longer active.');
      }

      if (allowedRoles.length && !allowedRoles.includes(admin.role)) {
        throw new ApiError(403, 'You do not have permission to do this.');
      }

      req.adminId = admin._id;
      req.adminRole = admin.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { adminAuth };