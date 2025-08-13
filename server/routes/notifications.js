const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

/**
 * Get late mark sheet notifications for principal dashboard
 * Shows tests where:
 * 1. marksEntryDeadline has passed
 * 2. Teacher is 10+ minutes late
 * 3. No marks have been uploaded yet
 */
router.get('/late-marksheet-notifications', authenticate, async (req, res) => {
  try {
    // Only allow Principal to access this endpoint
    if (req.user.role !== 'Principal') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only principals can view these notifications.'
      });
    }

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - (10 * 60 * 1000)); // 10 minutes ago

    // Find tests where marks entry deadline has passed by at least 10 minutes
    // and no marks have been uploaded
    const lateTests = await Test.find({
      isActive: true,
      marksEntryDeadline: {
        $exists: true,
        $ne: null,
        $lt: tenMinutesAgo // Deadline passed 10+ minutes ago
      }
    })
    .populate('classId', 'name grade section')
    .populate('assignedTeacher', 'name email')
    .lean();

    // Filter tests that have no marks uploaded
    const notificationsPromises = lateTests.map(async (test) => {
      // Check if any marks have been uploaded for this test
      const marksCount = await TestResult.countDocuments({ testId: test._id });
      
      if (marksCount === 0) {
        // Calculate how late the teacher is
        const lateDurationMs = now.getTime() - test.marksEntryDeadline.getTime();
        const lateDurationMinutes = Math.floor(lateDurationMs / (60 * 1000));
        const lateDurationHours = Math.floor(lateDurationMinutes / 60);
        const remainingMinutes = lateDurationMinutes % 60;

        let lateDurationText;
        if (lateDurationHours > 0) {
          lateDurationText = `${lateDurationHours}h ${remainingMinutes}m late`;
        } else {
          lateDurationText = `${lateDurationMinutes}m late`;
        }

        return {
          id: test._id,
          testTitle: test.title,
          subject: test.subject,
          testDate: test.testDate,
          marksEntryDeadline: test.marksEntryDeadline,
          class: test.classId,
          teacher: test.assignedTeacher,
          lateDurationMinutes,
          lateDurationText,
          severity: lateDurationHours >= 24 ? 'critical' : lateDurationHours >= 2 ? 'high' : 'medium'
        };
      }
      return null;
    });

    const notifications = (await Promise.all(notificationsPromises)).filter(Boolean);

    // Sort by how late they are (most late first)
    notifications.sort((a, b) => b.lateDurationMinutes - a.lateDurationMinutes);

    res.json({
      success: true,
      data: {
        notifications,
        totalCount: notifications.length,
        lastChecked: now
      }
    });

  } catch (error) {
    console.error('Error fetching late marksheet notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Take action on a late mark sheet notification
 * Actions: remind_teacher, escalate, mark_resolved, extend_deadline
 */
router.post('/late-marksheet-notifications/:testId/action', authenticate, async (req, res) => {
  try {
    // Only allow Principal to take action
    if (req.user.role !== 'Principal') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only principals can take action on notifications.'
      });
    }

    const { testId } = req.params;
    const { action, newDeadline, notes } = req.body;

    const validActions = ['remind_teacher', 'escalate', 'mark_resolved', 'extend_deadline'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Valid actions are: ' + validActions.join(', ')
      });
    }

    // Find the test
    const test = await Test.findById(testId)
      .populate('assignedTeacher', 'name email')
      .populate('classId', 'name grade section');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    let actionResult = {};

    switch (action) {
      case 'remind_teacher':
        // In a real implementation, you would send an email/notification to the teacher
        // For now, we'll just log the action
        actionResult = {
          action: 'remind_teacher',
          message: `Reminder sent to ${test.assignedTeacher?.name || 'assigned teacher'}`,
          teacher: test.assignedTeacher,
          timestamp: new Date()
        };
        break;

      case 'escalate':
        // Escalate to higher authorities
        actionResult = {
          action: 'escalate',
          message: 'Issue escalated to administration',
          escalatedTo: 'Administration',
          timestamp: new Date()
        };
        break;

      case 'mark_resolved':
        // Mark as resolved (maybe teacher uploaded marks manually)
        actionResult = {
          action: 'mark_resolved',
          message: 'Notification marked as resolved',
          resolvedBy: req.user.name,
          timestamp: new Date()
        };
        break;

      case 'extend_deadline':
        if (!newDeadline) {
          return res.status(400).json({
            success: false,
            message: 'New deadline is required for extend_deadline action'
          });
        }
        
        // Update the marks entry deadline
        test.marksEntryDeadline = new Date(newDeadline);
        await test.save();
        
        actionResult = {
          action: 'extend_deadline',
          message: `Deadline extended to ${new Date(newDeadline).toLocaleString()}`,
          oldDeadline: test.marksEntryDeadline,
          newDeadline: new Date(newDeadline),
          timestamp: new Date()
        };
        break;
    }

    // In a real implementation, you might want to log these actions in a separate collection
    // For now, we'll just return the action result

    res.json({
      success: true,
      data: {
        testId,
        test: {
          title: test.title,
          subject: test.subject,
          class: test.classId,
          teacher: test.assignedTeacher
        },
        actionTaken: actionResult,
        notes
      }
    });

  } catch (error) {
    console.error('Error taking action on notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing action',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Dismiss a notification (remove from principal's view)
 */
router.post('/late-marksheet-notifications/:testId/dismiss', authenticate, async (req, res) => {
  try {
    // Only allow Principal to dismiss notifications
    if (req.user.role !== 'Principal') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only principals can dismiss notifications.'
      });
    }

    const { testId } = req.params;
    const { reason } = req.body;

    // In a real implementation, you might want to track dismissed notifications
    // For now, we'll just return success
    
    res.json({
      success: true,
      data: {
        testId,
        dismissed: true,
        dismissedBy: req.user.name,
        dismissedAt: new Date(),
        reason: reason || 'No reason provided'
      }
    });

  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error dismissing notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
