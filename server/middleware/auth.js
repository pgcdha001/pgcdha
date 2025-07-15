const jwtService = require('../services/jwtService');
const AuditLog = require('../models/AuditLog');

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
      await AuditLog.logAction({
        user: decoded.userId || null,
        institute: decoded.instituteId || null,
        action: 'INVALID_TOKEN_ACCESS',
        resource: {
          type: 'System',
          name: 'Authentication'
        },
        details: {
          description: 'Attempted access with invalid token',
          metadata: {
            reason: validation.reason,
            tokenPayload: {
              userId: decoded.userId,
              sessionId: decoded.sessionId
            }
          }
        },
        requestInfo: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          endpoint: req.originalUrl,
          method: req.method
        },
        result: {
          status: 'FAILED',
          errorMessage: validation.reason
        },
        security: {
          riskLevel: 'MEDIUM',
          requiresReview: true
        }
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
    await AuditLog.logAction({
      user: null,
      institute: null,
      action: 'AUTHENTICATION_ERROR',
      resource: {
        type: 'System',
        name: 'Authentication'
      },
      details: {
        description: 'Authentication middleware error',
        metadata: {
          error: error.message
        }
      },
      requestInfo: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl,
        method: req.method
      },
      result: {
        status: 'FAILED',
        errorMessage: error.message
      },
      security: {
        riskLevel: 'MEDIUM'
      }
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
