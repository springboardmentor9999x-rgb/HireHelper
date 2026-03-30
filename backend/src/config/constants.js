module.exports = {
  // HTTP Status Codes
  HTTP_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Messages
  MESSAGES: {
    SUCCESS: 'Success',
    ERROR: 'Error',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User already exists',
    TOKEN_EXPIRED: 'Token has expired',
    UNAUTHORIZED: 'Unauthorized access',
  },

  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    RECRUITER: 'recruiter',
    CANDIDATE: 'candidate',
  },
};
