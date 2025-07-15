const { Permission, Role } = require('../models/RolePermission');
const AuditLog = require('../models/AuditLog');

/**
 * Role-based authorization middleware
 * @param {Array|String} allowedRoles - Array of allowed roles or single role
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        // Log permission denied
        await AuditLog.logAction({
          user: req.user._id,
          institute: req.user.institute,
          action: 'PERMISSION_DENIED',
          resource: {
            type: 'System',
            name: 'Authorization'
          },
          details: {
            description: 'Access denied due to insufficient role privileges',
            metadata: {
              userRole: req.user.role,
              requiredRoles: roles,
              endpoint: req.originalUrl
            }
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            sessionId: req.session?._id
          },
          result: {
            status: 'DENIED',
            statusCode: 403
          },
          security: {
            riskLevel: 'MEDIUM'
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient privileges',
          code: 'INSUFFICIENT_ROLE'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Permission-based authorization middleware
 * @param {String} permission - Required permission name
 * @param {String} scope - Optional scope check (institute, class, self)
 */
const requirePermission = (permission, scope = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const hasPermission = await checkUserPermission(req.user, permission, scope, req);

      if (!hasPermission) {
        // Log permission denied
        await AuditLog.logAction({
          user: req.user._id,
          institute: req.user.institute,
          action: 'PERMISSION_DENIED',
          resource: {
            type: 'System',
            name: 'Authorization'
          },
          details: {
            description: 'Access denied due to insufficient permissions',
            metadata: {
              userRole: req.user.role,
              requiredPermission: permission,
              requiredScope: scope,
              endpoint: req.originalUrl
            }
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            sessionId: req.session?._id
          },
          result: {
            status: 'DENIED',
            statusCode: 403
          },
          security: {
            riskLevel: 'MEDIUM'
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSION'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Multiple permissions middleware (requires ANY of the specified permissions)
 * @param {Array} permissions - Array of permission names
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      let hasAnyPermission = false;
      
      for (const permission of permissions) {
        if (await checkUserPermission(req.user, permission, null, req)) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        await AuditLog.logAction({
          user: req.user._id,
          institute: req.user.institute,
          action: 'PERMISSION_DENIED',
          resource: {
            type: 'System',
            name: 'Authorization'
          },
          details: {
            description: 'Access denied - none of the required permissions found',
            metadata: {
              userRole: req.user.role,
              requiredPermissions: permissions,
              endpoint: req.originalUrl
            }
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            sessionId: req.session?._id
          },
          result: {
            status: 'DENIED',
            statusCode: 403
          },
          security: {
            riskLevel: 'MEDIUM'
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSION'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Institute context middleware - ensures user belongs to specified institute
 * @param {String} paramName - Request parameter name containing institute ID
 */
const requireInstituteAccess = (paramName = 'instituteId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const requestedInstituteId = req.params[paramName] || req.body[paramName] || req.query[paramName];
      
      if (!requestedInstituteId) {
        return res.status(400).json({
          success: false,
          message: 'Institute ID is required'
        });
      }

      // SystemAdmin can access any institute
      if (req.user.role === 'SystemAdmin') {
        return next();
      }

      // Check if user belongs to the requested institute
      if (req.user.institute.toString() !== requestedInstituteId) {
        await AuditLog.logAction({
          user: req.user._id,
          institute: req.user.institute,
          action: 'CROSS_INSTITUTE_ACCESS_DENIED',
          resource: {
            type: 'Institute',
            id: requestedInstituteId,
            name: 'Institute Access'
          },
          details: {
            description: 'Attempted to access different institute data',
            metadata: {
              userInstitute: req.user.institute,
              requestedInstitute: requestedInstituteId,
              endpoint: req.originalUrl
            }
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            sessionId: req.session?._id
          },
          result: {
            status: 'DENIED',
            statusCode: 403
          },
          security: {
            riskLevel: 'HIGH',
            requiresReview: true
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied to this institute',
          code: 'CROSS_INSTITUTE_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Institute access check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Resource ownership middleware - ensures user can only access their own resources
 * @param {String} userIdParam - Parameter name for user ID in request
 */
const requireResourceOwnership = (userIdParam = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // SystemAdmin and InstituteAdmin can access any resource in their scope
      if (['SystemAdmin', 'InstituteAdmin'].includes(req.user.role)) {
        return next();
      }

      // Check if user is accessing their own resource
      if (req.user._id.toString() !== resourceUserId) {
        await AuditLog.logAction({
          user: req.user._id,
          institute: req.user.institute,
          action: 'UNAUTHORIZED_RESOURCE_ACCESS',
          resource: {
            type: 'User',
            id: resourceUserId,
            name: 'User Resource'
          },
          details: {
            description: 'Attempted to access another user\'s resource',
            metadata: {
              accessingUser: req.user._id,
              targetUser: resourceUserId,
              endpoint: req.originalUrl
            }
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            sessionId: req.session?._id
          },
          result: {
            status: 'DENIED',
            statusCode: 403
          },
          security: {
            riskLevel: 'HIGH'
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Resource ownership check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object
 * @param {String} permissionName - Permission name to check
 * @param {String} scope - Scope to check (optional)
 * @param {Object} req - Request object (for context)
 * @returns {Boolean} - True if user has permission
 */
const checkUserPermission = async (user, permissionName, scope = null, req = null) => {
  try {
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    // Populate roles if they're not already populated
    let userRoles = user.roles;
    if (user.roles.length > 0 && typeof user.roles[0] === 'string') {
      const User = require('../models/User');
      const populatedUser = await User.findById(user._id).populate({
        path: 'roles',
        populate: {
          path: 'permissions',
          model: 'RolePermission'
        }
      });
      userRoles = populatedUser.roles;
    }

    // Check each role for the permission
    for (const role of userRoles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        const hasPermission = role.permissions.some(permission => 
          permission.name === permissionName
        );
        
        if (hasPermission) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Get all permissions for a user
 * @param {Object} user - User object
 * @returns {Array} - Array of permission names
 */
const getUserPermissions = async (user) => {
  try {
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return [];
    }

    // Populate roles if they're not already populated
    let userRoles = user.roles;
    if (user.roles.length > 0 && typeof user.roles[0] === 'string') {
      const User = require('../models/User');
      const populatedUser = await User.findById(user._id).populate({
        path: 'roles',
        populate: {
          path: 'permissions',
          model: 'RolePermission'
        }
      });
      userRoles = populatedUser.roles;
    }

    const permissions = new Set();
    
    for (const role of userRoles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(permission => {
          permissions.add(permission.name);
        });
      }
    }

    return Array.from(permissions);
  } catch (error) {
    console.error('Get user permissions error:', error);
    return [];
  }
};

/**
 * Multiple permissions middleware (requires ANY of the specified permissions)
 * @param {Array} permissions - Array of permission names
 */
const requirePermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      let hasAnyPermission = false;
      
      for (const permission of permissions) {
        if (await checkUserPermission(req.user, permission, null, req)) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        await AuditLog.logAction({
          user: req.user._id,
          institute: req.user.institute,
          action: 'PERMISSION_DENIED',
          resource: {
            type: 'System',
            name: 'Authorization'
          },
          details: {
            description: 'Access denied - none of the required permissions found',
            metadata: {
              userRoles: req.user.roles,
              requiredPermissions: permissions,
              endpoint: req.originalUrl
            }
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            sessionId: req.session?._id
          },
          result: {
            status: 'DENIED',
            statusCode: 403
          },
          security: {
            riskLevel: 'MEDIUM'
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSION'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Middleware to inject user permissions into request
 */
const injectPermissions = async (req, res, next) => {
  try {
    if (req.user) {
      const role = await Role.findOne({ name: req.user.role }).populate('permissions');
      if (role) {
        req.userPermissions = await role.getEffectivePermissions();
      } else {
        req.userPermissions = [];
      }
    }
    next();
  } catch (error) {
    req.userPermissions = [];
    next();
  }
};

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requirePermissions,
  requireInstituteAccess,
  requireResourceOwnership,
  injectPermissions,
  checkUserPermission,
  getUserPermissions
};
