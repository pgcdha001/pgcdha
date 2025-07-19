const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Get timetable with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { classId, teacherId, dayOfWeek, floor, academicYear } = req.query;
    
    let query = { isActive: true };
    
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (academicYear) query.academicYear = academicYear;
    
    let timetable;
    
    if (floor) {
      // Get timetable for specific floor
      timetable = await Timetable.getFloorTimetable(parseInt(floor), dayOfWeek);
    } else {
      // Regular query
      timetable = await Timetable.find(query)
        .populate('teacherId', 'fullName userName email')
        .populate('classId', 'name grade campus program floor')
        .populate('createdBy', 'fullName userName')
        .sort({ dayOfWeek: 1, startTime: 1 });
    }

    res.json({
      success: true,
      timetable,
      total: timetable.length
    });

  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ message: 'Error fetching timetable', error: error.message });
  }
});

// Get timetable for a specific class
router.get('/class/:classId', authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    const { dayOfWeek } = req.query;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    let timetable;
    if (dayOfWeek) {
      timetable = await Timetable.getClassTimetable(classId, dayOfWeek);
    } else {
      // Get full week timetable
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekTimetable = {};
      
      for (const day of days) {
        weekTimetable[day] = await Timetable.getClassTimetable(classId, day);
      }
      
      timetable = weekTimetable;
    }

    res.json({
      success: true,
      class: {
        id: classDoc._id,
        name: classDoc.name,
        grade: classDoc.grade,
        campus: classDoc.campus,
        program: classDoc.program,
        floor: classDoc.floor
      },
      timetable
    });

  } catch (error) {
    console.error('Error fetching class timetable:', error);
    res.status(500).json({ message: 'Error fetching class timetable', error: error.message });
  }
});

// Get timetable for a teacher
router.get('/teacher/:teacherId', authenticate, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { dayOfWeek } = req.query;

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.role !== 'Teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    let schedule;
    if (dayOfWeek) {
      schedule = await Timetable.getTeacherSchedule(teacherId, dayOfWeek);
    } else {
      // Get full week schedule
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekSchedule = {};
      
      for (const day of days) {
        weekSchedule[day] = await Timetable.getTeacherSchedule(teacherId, day);
      }
      
      schedule = weekSchedule;
    }

    res.json({
      success: true,
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        userName: teacher.userName,
        email: teacher.email
      },
      schedule
    });

  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ message: 'Error fetching teacher schedule', error: error.message });
  }
});

// Get timetable for a floor
router.get('/floor/:floorNumber', authenticate, async (req, res) => {
  try {
    const { floorNumber } = req.params;
    const { dayOfWeek } = req.query;
    
    const floor = parseInt(floorNumber);
    if (floor < 1 || floor > 4) {
      return res.status(400).json({ message: 'Invalid floor number. Must be 1-4.' });
    }

    const floorInfo = {
      1: { name: '11th Boys Floor', campus: 'Boys', grade: '11th' },
      2: { name: '12th Boys Floor', campus: 'Boys', grade: '12th' },
      3: { name: '11th Girls Floor', campus: 'Girls', grade: '11th' },
      4: { name: '12th Girls Floor', campus: 'Girls', grade: '12th' }
    };

    let timetable;
    if (dayOfWeek) {
      timetable = await Timetable.getFloorTimetable(floor, dayOfWeek);
    } else {
      // Get full week timetable
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekTimetable = {};
      
      for (const day of days) {
        weekTimetable[day] = await Timetable.getFloorTimetable(floor, day);
      }
      
      timetable = weekTimetable;
    }

    res.json({
      success: true,
      floor: {
        number: floor,
        ...floorInfo[floor]
      },
      timetable
    });

  } catch (error) {
    console.error('Error fetching floor timetable:', error);
    res.status(500).json({ message: 'Error fetching floor timetable', error: error.message });
  }
});

// Create new timetable entry
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      classId,
      dayOfWeek,
      startTime,
      endTime,
      teacherId,
      subject,
      lectureType,
      academicYear
    } = req.body;

    // Validate required fields
    if (!classId || !dayOfWeek || !startTime || !endTime || !teacherId || !subject) {
      return res.status(400).json({
        message: 'Class, day, time slot, teacher, and subject are required'
      });
    }

    // Validate class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Validate teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.role !== 'Teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    // Create new timetable entry
    const timetableData = {
      title: title || `${subject} - ${classDoc.name}`,
      classId,
      dayOfWeek,
      startTime,
      endTime,
      teacherId,
      subject,
      lectureType: lectureType || 'Theory',
      academicYear: academicYear || undefined,
      createdBy: req.user.id
    };

    const newTimetable = new Timetable(timetableData);

    // Check for time conflicts
    const conflicts = await newTimetable.hasTimeConflict();
    if (conflicts.length > 0) {
      const conflictDetails = conflicts.map(c => ({
        type: c.teacherId.toString() === teacherId ? 'teacher' : 'class',
        teacher: c.teacherId.fullName,
        class: c.classId.name,
        time: `${c.startTime} - ${c.endTime}`
      }));

      return res.status(400).json({
        message: 'Time conflict detected',
        conflicts: conflictDetails
      });
    }

    await newTimetable.save();
    await newTimetable.populate('teacherId classId createdBy');

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      timetable: newTimetable
    });

  } catch (error) {
    console.error('Error creating timetable:', error);
    res.status(500).json({ message: 'Error creating timetable', error: error.message });
  }
});

// Update timetable entry
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Add lastUpdatedBy
    updateData.lastUpdatedBy = req.user.id;

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    // Update the document
    Object.assign(timetable, updateData);

    // Check for conflicts if time or participants changed
    if (updateData.startTime || updateData.endTime || updateData.teacherId || updateData.classId) {
      const conflicts = await timetable.hasTimeConflict();
      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map(c => ({
          type: c.teacherId.toString() === timetable.teacherId.toString() ? 'teacher' : 'class',
          teacher: c.teacherId.fullName || 'Unknown',
          class: c.classId.name || 'Unknown',
          time: `${c.startTime} - ${c.endTime}`
        }));

        return res.status(400).json({
          message: 'Time conflict detected',
          conflicts: conflictDetails
        });
      }
    }

    await timetable.save();
    await timetable.populate('teacherId classId createdBy lastUpdatedBy');

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      timetable
    });

  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ message: 'Error updating timetable', error: error.message });
  }
});

// Delete timetable entry
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    // Soft delete - mark as inactive
    timetable.isActive = false;
    timetable.lastUpdatedBy = req.user.id;
    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ message: 'Error deleting timetable', error: error.message });
  }
});

// Bulk create timetable (for importing)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { timetableEntries } = req.body;

    if (!Array.isArray(timetableEntries) || timetableEntries.length === 0) {
      return res.status(400).json({ message: 'Timetable entries array is required' });
    }

    const results = {
      success: [],
      errors: [],
      conflicts: []
    };

    for (let i = 0; i < timetableEntries.length; i++) {
      try {
        const entry = { ...timetableEntries[i], createdBy: req.user.id };
        const timetable = new Timetable(entry);

        // Check for conflicts
        const conflicts = await timetable.hasTimeConflict();
        if (conflicts.length > 0) {
          results.conflicts.push({
            index: i,
            entry,
            conflicts: conflicts.map(c => ({
              teacher: c.teacherId.fullName,
              class: c.classId.name,
              time: `${c.startTime} - ${c.endTime}`
            }))
          });
          continue;
        }

        await timetable.save();
        await timetable.populate('teacherId classId');
        results.success.push(timetable);

      } catch (error) {
        results.errors.push({
          index: i,
          entry: timetableEntries[i],
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${timetableEntries.length} entries`,
      results: {
        successful: results.success.length,
        errors: results.errors.length,
        conflicts: results.conflicts.length
      },
      details: results
    });

  } catch (error) {
    console.error('Error bulk creating timetable:', error);
    res.status(500).json({ message: 'Error bulk creating timetable', error: error.message });
  }
});

// Get timetable for specific floors and date
router.get('/floors/:floors/date/:date', authenticate, async (req, res) => {
  try {
    const { floors, date } = req.params;
    const floorNumbers = floors.split(',').map(f => parseInt(f));
    
    // Get classes for these floors
    const classes = await Class.find({
      floor: { $in: floorNumbers },
      isActive: true
    });
    
    const classIds = classes.map(cls => cls._id);
    
    // Get timetable entries for the date and classes
    const timetable = await Timetable.find({
      classId: { $in: classIds },
      weekDate: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      isActive: true
    })
    .populate('teacherId', 'fullName userName email')
    .populate('classId', 'name grade campus program floor')
    .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('Error fetching floors timetable:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching floors timetable', 
      error: error.message 
    });
  }
});

// Get timetable for specific floors and week
router.get('/floors/:floors/week/:weekDate', authenticate, async (req, res) => {
  try {
    const { floors, weekDate } = req.params;
    const floorNumbers = floors.split(',').map(f => parseInt(f));
    
    // Get classes for these floors
    const classes = await Class.find({
      floor: { $in: floorNumbers },
      isActive: true
    });
    
    const classIds = classes.map(cls => cls._id);
    
    // Calculate week range
    const startDate = new Date(weekDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Get timetable entries for the week and classes
    const timetable = await Timetable.find({
      classId: { $in: classIds },
      weekDate: {
        $gte: startDate,
        $lte: endDate
      },
      isActive: true
    })
    .populate('teacherId', 'fullName userName email')
    .populate('classId', 'name grade campus program floor')
    .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('Error fetching floors week timetable:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching floors week timetable', 
      error: error.message 
    });
  }
});

module.exports = router;
