const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const TeacherAttendance = require('../models/TeacherAttendance');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

/**
 * Get late teacher notifications for principal dashboard
 * Shows teachers who are:
 * 1. Marked as late in today's classes
 * 2. Late by 10+ minutes
 * 3. Currently in active lectures
 */
router.get('/late-teacher-notifications', authenticate, async (req, res) => {
  try {
    // Only allow Principal to access this endpoint
    if (req.user.role !== 'Principal') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only principals can view these notifications.'
      });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find today's teacher attendance records where teachers are late by 10+ minutes
    // and no notification action has been taken yet
    const lateTeacherRecords = await TeacherAttendance.find({
      date: { $gte: today, $lte: endOfDay },
      status: 'Late',
      lateMinutes: { $gte: 10 }, // 10+ minutes late
      notificationActionTaken: { $ne: true } // Only show notifications that haven't been acted upon
    })
    .populate('teacherId', 'fullName userName email')
    .populate('classId', 'name grade section campus')
    .populate('timetableId', 'subject startTime endTime dayOfWeek')
    .lean();

    // Process notifications with additional context
    const notifications = await Promise.all(lateTeacherRecords.map(async (record) => {
      const teacher = record.teacherId;
      const classInfo = record.classId;
      const timetable = record.timetableId;

      // Calculate how much time has passed since the class started
      const classStartTime = new Date(today);
      const [startHour, startMinute] = timetable.startTime.split(':');
      classStartTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const currentTime = now;
      const timeSinceStart = Math.floor((currentTime - classStartTime) / (60 * 1000)); // minutes
      
      // Determine severity based on late minutes
      let severity = 'medium';
      if (record.lateMinutes >= 40) {
        severity = 'critical';
      } else if (record.lateMinutes >= 20) {
        severity = 'high';
      }

      // Format late duration text
      let lateDurationText;
      if (record.lateMinutes >= 60) {
        const hours = Math.floor(record.lateMinutes / 60);
        const remainingMinutes = record.lateMinutes % 60;
        lateDurationText = `${hours}h ${remainingMinutes}m late`;
      } else {
        lateDurationText = `${record.lateMinutes}m late`;
      }

      return {
        id: record._id,
        teacherId: teacher._id,
        teacherName: `${teacher.fullName?.firstName || ''} ${teacher.fullName?.lastName || ''}`.trim(),
        teacherEmail: teacher.email,
        teacherUserName: teacher.userName,
        className: `${classInfo.name} - ${classInfo.grade}${classInfo.section ? ` ${classInfo.section}` : ''}`,
        subject: record.subject || timetable.subject,
        classStartTime: timetable.startTime,
        classEndTime: timetable.endTime,
        lateMinutes: record.lateMinutes,
        lateDurationText,
        timeSinceClassStart: timeSinceStart,
        remarks: record.remarks,
        markedAt: record.createdOn,
        floor: record.floor,
        severity,
        classId: classInfo._id,
        timetableId: timetable._id
      };
    }));

    // Sort by late minutes (most late first)
    notifications.sort((a, b) => b.lateMinutes - a.lateMinutes);

    res.json({
      success: true,
      data: {
        notifications,
        totalCount: notifications.length,
        lastChecked: now,
        todayDate: today.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error fetching late teacher notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Take action on a late teacher notification
 * Actions: remind_teacher, contact_coordinator, escalate, mark_resolved
 */
router.post('/late-teacher-notifications/:attendanceId/action', authenticate, async (req, res) => {
  try {
    // Only allow Principal to take action
    if (req.user.role !== 'Principal') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only principals can take action on notifications.'
      });
    }

    const { attendanceId } = req.params;
    const { action, notes } = req.body;

    const validActions = ['contact_coordinator', 'escalate', 'mark_resolved'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Valid actions are: ' + validActions.join(', ')
      });
    }

    // Find the attendance record
    const attendanceRecord = await TeacherAttendance.findById(attendanceId)
      .populate('teacherId', 'fullName userName email')
      .populate('classId', 'name grade section')
      .populate('timetableId', 'subject startTime endTime');

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    let actionResult = {};

    switch (action) {
      case 'contact_coordinator':
        // Contact the floor coordinator
        actionResult = {
          action: 'contact_coordinator',
          message: `Floor coordinator contacted for Floor ${attendanceRecord.floor}`,
          floor: attendanceRecord.floor,
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
        // Mark as resolved (maybe teacher arrived or class was cancelled)
        actionResult = {
          action: 'mark_resolved',
          message: 'Notification marked as resolved',
          resolvedBy: req.user.fullName?.firstName || req.user.userName,
          timestamp: new Date()
        };
        break;
    }

    // Add notes if provided
    if (notes && notes.trim()) {
      actionResult.notes = notes.trim();
    }

    // Mark the attendance record as acted upon to prevent it from appearing in future notifications
    await TeacherAttendance.findByIdAndUpdate(attendanceId, {
      notificationActionTaken: true,
      notificationAction: action,
      notificationActionTimestamp: new Date(),
      notificationActionBy: req.user._id,
      notificationActionNotes: notes?.trim() || null
    });

    res.json({
      success: true,
      data: {
        attendanceId,
        teacherName: `${attendanceRecord.teacherId?.fullName?.firstName || ''} ${attendanceRecord.teacherId?.fullName?.lastName || ''}`.trim(),
        className: `${attendanceRecord.classId?.name} - ${attendanceRecord.classId?.grade}${attendanceRecord.classId?.section ? ` ${attendanceRecord.classId?.section}` : ''}`,
        subject: attendanceRecord.subject,
        actionTaken: actionResult,
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error processing teacher notification action:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing action',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get late mark sheet notifications for principal dashboard
 * Shows tests where:
 * 1. marksEntryDeadline has passed
 * 2. Teacher is 10+ minutes late
 * 3. Persist until an action is taken (even if marks are later uploaded)
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
    // and no marks have been uploaded and no action has been taken
    const lateTests = await Test.find({
      isActive: true,
      marksEntryDeadline: {
        $exists: true,
        $ne: null,
        $lt: tenMinutesAgo // Deadline passed 10+ minutes ago
      },
      notificationActionTaken: { $ne: true } // Only show if no action has been taken
    })
    .populate('classId', 'name grade section')
    .populate('assignedTeacher', 'name email')
    .lean();

    // Build notifications regardless of whether marks were uploaded later
    const notificationsPromises = lateTests.map(async (test) => {
      // Check if any marks have been uploaded for this test (for context only)
      const marksCount = await TestResult.countDocuments({ testId: test._id });
      const marksUploaded = marksCount > 0;

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
        severity: lateDurationHours >= 24 ? 'critical' : lateDurationHours >= 2 ? 'high' : 'medium',
        marksUploaded
      };
    });

    const notifications = await Promise.all(notificationsPromises);

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

    const validActions = ['mark_resolved', 'extend_deadline'];
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
      case 'mark_resolved':
        // Mark as resolved (maybe teacher uploaded marks manually)
        test.notificationActionTaken = true;
        test.lastNotificationActionDate = new Date();
        await test.save();
        
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
        
        // Store original deadline if not already stored
        if (!test.originalMarksEntryDeadline) {
          test.originalMarksEntryDeadline = test.marksEntryDeadline;
        }
        
        // Update the marks entry deadline and reset notification flag
        test.marksEntryDeadline = new Date(newDeadline);
        test.notificationActionTaken = false; // Reset so notification can show again if needed
        test.lastNotificationActionDate = new Date();
        await test.save();
        
        actionResult = {
          action: 'extend_deadline',
          message: `Deadline extended to ${new Date(newDeadline).toLocaleString()}`,
          oldDeadline: test.originalMarksEntryDeadline || test.marksEntryDeadline,
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

    // Mark action taken so the notification no longer appears
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    test.notificationActionTaken = true;
    test.lastNotificationActionDate = new Date();
    await test.save();

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
