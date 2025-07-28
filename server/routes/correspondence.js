const express = require('express');
const router = express.Router();
const Correspondence = require('../models/Correspondence');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Get all correspondence with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      type, 
      dateFilter, 
      startDate, 
      endDate, 
      level,
      staffMember,
      nonProgression,
      progressionLevel 
    } = req.query;

    // Build base query for correspondence
    let query = {};

    // Filter by correspondence type
    if (type && ['enquiry', 'student'].includes(type)) {
      query.type = type;
    }

    // Filter by student level
    if (level && level !== 'all') {
      query.studentLevel = parseInt(level);
    }

    // Filter by staff member
    if (staffMember && staffMember !== 'all') {
      query['staffMember.id'] = staffMember;
    }

    // Apply date filter for correspondence
    if (dateFilter && dateFilter !== 'all') {
      if (dateFilter === 'custom' && startDate && endDate) {
        const customStartDate = new Date(startDate);
        const customEndDate = new Date(endDate);
        customEndDate.setHours(23, 59, 59, 999);
        
        query.timestamp = { 
          $gte: customStartDate,
          $lte: customEndDate
        };
      } else {
        const now = new Date();
        let filterStartDate;

        switch (dateFilter) {
          case 'today':
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            filterStartDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            filterStartDate = null;
        }

        if (filterStartDate) {
          query.timestamp = { $gte: filterStartDate };
        }
      }
    }

    // Handle non-progression filter
    if (nonProgression === 'true' && progressionLevel) {
      const level = parseInt(progressionLevel);
      
      // Find students who didn't progress to the specified level
      const nonProgressedStudents = await User.find({
        role: 'Student',
        prospectusStage: level - 1 // Students at previous level who should have progressed
      }).select('_id');
      
      const studentIds = nonProgressedStudents.map(s => s._id);
      
      if (studentIds.length > 0) {
        query.studentId = { $in: studentIds };
      } else {
        // No non-progressed students found, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 50,
            pages: 0
          }
        });
      }
    }

    // Get correspondence with populated student data
    const correspondence = await Correspondence.find(query)
      .populate('studentId', 'fullName email prospectusStage gender')
      .sort({ timestamp: -1 })
      .lean();

    // Also get level changes from remarks as correspondence entries
    let levelChangeQuery = {
      role: 'Student',
      receptionistRemarks: { $exists: true, $ne: [] }
    };

    // Apply same date filters to level changes
    if (dateFilter && dateFilter !== 'all') {
      if (dateFilter === 'custom' && startDate && endDate) {
        const customStartDate = new Date(startDate);
        const customEndDate = new Date(endDate);
        customEndDate.setHours(23, 59, 59, 999);
        
        levelChangeQuery['receptionistRemarks.timestamp'] = { 
          $gte: customStartDate,
          $lte: customEndDate
        };
      } else {
        // Handle other date filters
        const now = new Date();
        let dateFrom = new Date();
        
        switch (dateFilter) {
          case 'today':
            dateFrom.setHours(0, 0, 0, 0);
            break;
          case 'week':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case 'month':
            dateFrom.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            dateFrom.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            dateFrom.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        if (dateFilter !== 'all') {
          levelChangeQuery['receptionistRemarks.timestamp'] = { $gte: dateFrom };
        }
      }
    }

    // Get students with level change remarks
    const studentsWithRemarks = await User.find(levelChangeQuery)
      .select('fullName email prospectusStage gender receptionistRemarks')
      .lean();

    // Convert remarks to correspondence format (individual entries for each level change)
    const levelChangeEntries = [];
    const uniqueStudentsContacted = new Set();
    
    studentsWithRemarks.forEach(student => {
      if (student.receptionistRemarks && student.receptionistRemarks.length > 0) {
        // Filter remarks by date
        const filteredRemarks = student.receptionistRemarks.filter(remark => {
          const remarkDate = new Date(remark.timestamp);
          let includeRemark = true;
          
          if (dateFilter && dateFilter !== 'all') {
            if (dateFilter === 'custom' && startDate && endDate) {
              const customStartDate = new Date(startDate);
              const customEndDate = new Date(endDate);
              customEndDate.setHours(23, 59, 59, 999);
              includeRemark = remarkDate >= customStartDate && remarkDate <= customEndDate;
            } else {
              const now = new Date();
              let dateFrom = new Date();
              
              switch (dateFilter) {
                case 'today':
                  dateFrom.setHours(0, 0, 0, 0);
                  break;
                case 'week':
                  dateFrom.setDate(now.getDate() - 7);
                  break;
                case 'month':
                  dateFrom.setMonth(now.getMonth() - 1);
                  break;
                case 'quarter':
                  dateFrom.setMonth(now.getMonth() - 3);
                  break;
                case 'year':
                  dateFrom.setFullYear(now.getFullYear() - 1);
                  break;
              }
              
              includeRemark = remarkDate >= dateFrom;
            }
          }
          
          return includeRemark;
        });

        if (filteredRemarks.length > 0) {
          // Determine type based on student level
          const studentLevel = student.prospectusStage || 1;
          const correspondenceType = studentLevel <= 4 ? 'enquiry' : 'student';
          
          // Filter by type if specified
          if (!type || type === correspondenceType) {
            // Filter by level if specified
            if (!level || level === 'all' || studentLevel === parseInt(level)) {
              // Count this student as contacted (only once regardless of number of remarks)
              uniqueStudentsContacted.add(student._id.toString());
              
              // Create individual correspondence entries for each remark/level change
              filteredRemarks.forEach((remark, index) => {
                levelChangeEntries.push({
                  _id: `remark_${student._id}_${remark._id || index}_${remark.timestamp}`,
                  studentId: {
                    _id: student._id,
                    fullName: student.fullName,
                    email: student.email,
                    prospectusStage: student.prospectusStage,
                    gender: student.gender
                  },
                  type: correspondenceType,
                  subject: 'Level Change / Communication',
                  message: remark.remark,
                  studentLevel: studentLevel,
                  staffMember: {
                    id: remark.receptionistId,
                    name: remark.receptionistName
                  },
                  timestamp: remark.timestamp,
                  isLevelChange: true, // Flag to identify level change entries
                  remarkIndex: index + 1,
                  totalRemarks: filteredRemarks.length
                });
              });
            }
          }
        }
      }
    });

    // Combine correspondence and level changes
    const allEntries = [...correspondence, ...levelChangeEntries];
    
    // Sort by timestamp (newest first)
    allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Count unique students from both correspondence and remarks
    const correspondenceStudents = new Set(correspondence.map(c => c.studentId._id.toString()));
    const allUniqueStudents = new Set([...correspondenceStudents, ...uniqueStudentsContacted]);

    res.json({
      success: true,
      data: allEntries,
      stats: {
        totalCorrespondence: correspondence.length,
        totalLevelChangeEntries: levelChangeEntries.length,
        uniqueStudentsContacted: allUniqueStudents.size,
        uniqueStudentsFromRemarks: uniqueStudentsContacted.size,
        uniqueStudentsFromCorrespondence: correspondenceStudents.size,
        breakdown: {
          individualCorrespondenceRecords: correspondence.length,
          individualLevelChangeRecords: levelChangeEntries.length,
          totalIndividualRecords: allEntries.length
        }
      },
      pagination: {
        total: allEntries.length,
        page: 1,
        limit: 50,
        pages: Math.ceil(allEntries.length / 50)
      }
    });

  } catch (error) {
    console.error('Error fetching correspondence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correspondence'
    });
  }
});

// Create new correspondence
router.post('/', authenticate, async (req, res) => {
  try {
    const { studentId, type, subject, message } = req.body;

    // Validate required fields
    if (!studentId || !type || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate correspondence type based on student level
    const studentLevel = student.prospectusStage || 1;
    if (type === 'enquiry' && studentLevel >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create enquiry correspondence for admitted students (Level 5+)'
      });
    }
    if (type === 'student' && studentLevel < 5) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create student correspondence for non-admitted students (Level < 5)'
      });
    }

    // Create correspondence
    const correspondence = new Correspondence({
      studentId,
      type,
      subject,
      message,
      staffMember: {
        id: req.user.id,
        name: `${req.user.fullName?.firstName || ''} ${req.user.fullName?.lastName || ''}`.trim() || req.user.userName,
        role: req.user.role
      },
      studentLevel
    });

    await correspondence.save();

    // Populate student details for response
    await correspondence.populate('studentId', 'fullName email prospectusStage');

    res.status(201).json({
      success: true,
      message: 'Correspondence created successfully',
      data: correspondence
    });

  } catch (error) {
    console.error('Error creating correspondence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create correspondence'
    });
  }
});

// PUT /correspondence/:id - Update correspondence
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, type, subject, message } = req.body;

    // Validate required fields
    if (!studentId || !type || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (studentId, type, subject, message)'
      });
    }

    // Validate correspondence type
    if (!['enquiry', 'student'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "enquiry" or "student"'
      });
    }

    // Check if correspondence exists
    const existingCorrespondence = await Correspondence.findById(id);
    if (!existingCorrespondence) {
      return res.status(404).json({
        success: false,
        message: 'Correspondence not found'
      });
    }

    // Get student details to validate type constraints
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentLevel = student.enquiryLevel || 1;

    // Validate type constraints
    if (type === 'enquiry' && studentLevel > 4) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry correspondence is only available for students at levels 1-4'
      });
    }

    if (type === 'student' && studentLevel < 5) {
      return res.status(400).json({
        success: false,
        message: 'Student correspondence is only available for students at level 5 or admitted students'
      });
    }

    // Update correspondence
    const updatedCorrespondence = await Correspondence.findByIdAndUpdate(
      id,
      {
        studentId,
        type,
        subject: subject.trim(),
        message: message.trim(),
        studentLevel,
        // Keep original staffMember and timestamp
        staffMember: existingCorrespondence.staffMember,
        timestamp: existingCorrespondence.timestamp
      },
      { new: true, runValidators: true }
    ).populate('studentId', 'fullName enquiryLevel');

    res.status(200).json({
      success: true,
      message: 'Correspondence updated successfully',
      data: updatedCorrespondence
    });

  } catch (error) {
    console.error('Error updating correspondence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update correspondence',
      error: error.message
    });
  }
});

// DELETE /correspondence/:id - Delete correspondence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if correspondence exists
    const correspondence = await Correspondence.findById(id);
    if (!correspondence) {
      return res.status(404).json({
        success: false,
        message: 'Correspondence not found'
      });
    }

    // Delete the correspondence
    await Correspondence.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Correspondence deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting correspondence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete correspondence',
      error: error.message
    });
  }
});

// Get unique students contact statistics
router.get('/stats/unique-students', authenticate, async (req, res) => {
  try {
    const { 
      dateFilter, 
      startDate, 
      endDate, 
      type,
      level 
    } = req.query;

    // Build date query
    let dateQuery = {};
    if (dateFilter && dateFilter !== 'all') {
      if (dateFilter === 'custom' && startDate && endDate) {
        const customStartDate = new Date(startDate);
        const customEndDate = new Date(endDate);
        customEndDate.setHours(23, 59, 59, 999);
        dateQuery = { 
          $gte: customStartDate,
          $lte: customEndDate
        };
      } else {
        const now = new Date();
        let dateFrom = new Date();
        
        switch (dateFilter) {
          case 'today':
            dateFrom.setHours(0, 0, 0, 0);
            break;
          case 'week':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case 'month':
            dateFrom.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            dateFrom.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            dateFrom.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        if (dateFilter !== 'all') {
          dateQuery = { $gte: dateFrom };
        }
      }
    }

    // Get unique students from correspondence
    let correspondenceQuery = {};
    if (Object.keys(dateQuery).length > 0) {
      correspondenceQuery.timestamp = dateQuery;
    }
    if (type && ['enquiry', 'student'].includes(type)) {
      correspondenceQuery.type = type;
    }
    if (level && level !== 'all') {
      correspondenceQuery.studentLevel = parseInt(level);
    }

    const correspondenceStudents = await Correspondence.find(correspondenceQuery)
      .distinct('studentId');

    // Get unique students from remarks
    let remarksQuery = {
      role: 'Student',
      receptionistRemarks: { $exists: true, $ne: [] }
    };
    
    if (Object.keys(dateQuery).length > 0) {
      remarksQuery['receptionistRemarks.timestamp'] = dateQuery;
    }

    const studentsWithRemarks = await User.find(remarksQuery)
      .select('_id prospectusStage receptionistRemarks')
      .lean();

    // Filter students with remarks by type and level
    const filteredRemarksStudents = studentsWithRemarks.filter(student => {
      const studentLevel = student.prospectusStage || 1;
      const correspondenceType = studentLevel <= 4 ? 'enquiry' : 'student';
      
      // Check type filter
      if (type && type !== correspondenceType) {
        return false;
      }
      
      // Check level filter
      if (level && level !== 'all' && studentLevel !== parseInt(level)) {
        return false;
      }

      // Check if student has remarks in the date range
      if (Object.keys(dateQuery).length > 0) {
        return student.receptionistRemarks.some(remark => {
          const remarkDate = new Date(remark.timestamp);
          if (dateQuery.$gte && dateQuery.$lte) {
            return remarkDate >= dateQuery.$gte && remarkDate <= dateQuery.$lte;
          } else if (dateQuery.$gte) {
            return remarkDate >= dateQuery.$gte;
          }
          return true;
        });
      }
      
      return true;
    });

    const remarksStudentIds = filteredRemarksStudents.map(s => s._id.toString());
    const correspondenceStudentIds = correspondenceStudents.map(s => s.toString());
    
    // Combine unique students
    const allUniqueStudents = new Set([...correspondenceStudentIds, ...remarksStudentIds]);

    // Get student details for the unique students
    const uniqueStudentDetails = await User.find({
      _id: { $in: Array.from(allUniqueStudents) }
    }).select('fullName email prospectusStage gender campus program')
      .lean();

    // Group by level and type
    const statsByLevel = {};
    const statsByType = { enquiry: 0, student: 0 };
    const statsByGender = { male: 0, female: 0, other: 0 };

    uniqueStudentDetails.forEach(student => {
      const level = student.prospectusStage || 1;
      const studentType = level <= 4 ? 'enquiry' : 'student';
      const gender = (student.gender || 'other').toLowerCase();

      // Count by level
      statsByLevel[level] = (statsByLevel[level] || 0) + 1;
      
      // Count by type
      statsByType[studentType]++;
      
      // Count by gender
      if (gender === 'male' || gender === 'female') {
        statsByGender[gender]++;
      } else {
        statsByGender.other++;
      }
    });

    res.json({
      success: true,
      data: {
        uniqueStudentsCount: allUniqueStudents.size,
        fromCorrespondence: correspondenceStudentIds.length,
        fromRemarks: remarksStudentIds.length,
        statsByLevel,
        statsByType,
        statsByGender,
        studentDetails: uniqueStudentDetails
      }
    });

  } catch (error) {
    console.error('Error fetching unique students stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unique students statistics',
      error: error.message
    });
  }
});

module.exports = router;
