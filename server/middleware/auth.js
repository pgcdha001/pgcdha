const jwtService = require('../services/jwtService');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    
    // Verify token
    const decoded = jwtService.verifyAccessToken(token);
    
    // Validate session
    const validation = await jwtService.validateSession(decoded);
    
    if (!validation.valid) {
      // Log suspicious activity
      console.error('Authentication failed:', {
        reason: validation.reason,
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    // Update session activity
    await validation.session.updateActivity();

    // Attach user and session info to request
    req.user = validation.user;
    req.session = validation.session;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    // Log authentication error
    console.error('Authentication error:', {
      error: error.message,
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continue without authentication
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    const decoded = jwtService.verifyAccessToken(token);
    const validation = await jwtService.validateSession(decoded);
    
    if (validation.valid) {
      req.user = validation.user;
      req.session = validation.session;
      req.tokenPayload = decoded;
      await validation.session.updateActivity();
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
