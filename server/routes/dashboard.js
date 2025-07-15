const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'SystemAdmin' && req.user.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  // Get user statistics
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const pendingApprovals = await User.countDocuments({ isApproved: false });
  
  // Get users by role
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get active sessions (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeSessions = await Session.countDocuments({
    expiresAt: { $gt: new Date() },
    createdAt: { $gte: twentyFourHoursAgo }
  });

  // Get recent registrations (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });

  // System health metrics
  const systemHealth = {
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      pendingApprovals,
      activeSessions,
      recentRegistrations,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      systemHealth
    }
  });
}));

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent system activity
 * @access  Private (Admin only)
 */
router.get('/activity', asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'SystemAdmin' && req.user.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  const limit = parseInt(req.query.limit) || 10;
  
  // Get recent user registrations
  const recentUsers = await User.find({}, {
    fullName: 1,
    email: 1,
    role: 1,
    createdAt: 1,
    isApproved: 1
  })
  .sort({ createdAt: -1 })
  .limit(limit);

  // Transform to activity format
  const activities = recentUsers.map(user => ({
    id: user._id,
    type: 'user_registered',
    message: `New user registered: ${user.email}`,
    details: {
      userName: `${user.fullName?.firstName || ''} ${user.fullName?.lastName || ''}`.trim(),
      userRole: user.role,
      isApproved: user.isApproved
    },
    timestamp: user.createdAt,
    icon: 'user',
    color: user.isApproved ? 'green' : 'orange'
  }));

  // Add some system events (simulated for now)
  const systemEvents = [
    {
      id: 'system_backup_' + Date.now(),
      type: 'system_backup',
      message: 'System backup completed successfully',
      details: { size: '2.3GB', duration: '45 minutes' },
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      icon: 'database',
      color: 'blue'
    },
    {
      id: 'system_health_' + Date.now(),
      type: 'system_health',
      message: 'System health check completed',
      details: { status: 'healthy', uptime: process.uptime() },
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      icon: 'activity',
      color: 'green'
    }
  ];

  // Combine and sort by timestamp
  const allActivities = [...activities, ...systemEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  res.json({
    success: true,
    data: allActivities
  });
}));

module.exports = router;
