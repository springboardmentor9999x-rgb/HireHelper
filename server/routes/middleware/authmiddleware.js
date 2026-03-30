const jwt = require('jsonwebtoken');

/**
 * Express middleware that verifies the JWT from the Authorization header.
 * Attaches `req.user` with the decoded payload on success.
 *
 * Usage:  router.get('/protected', authMiddleware, handler);
 */
function authMiddleware(req, res, next) {
    console.log(`[Backend Auth] Incoming: ${req.method} ${req.url}`);
    const authHeader = req.headers.authorization;
    console.log(`[Backend Auth] AuthHeader: ${authHeader ? 'Present' : 'Missing'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[Backend Auth] Denied: No Bearer token');
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;        // { id, email, name, iat, exp }
        console.log(`[Backend Auth] Verified for user: ${decoded.id}`);
        next();
    } catch (err) {
        console.error('[Backend Auth] Token error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
}

module.exports = authMiddleware;
