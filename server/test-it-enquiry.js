require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI);

async function testITEnquiryManagement() {
  console.log('=== TESTING IT ENQUIRY MANAGEMENT QUERIES ===\n');
  
  // Test the default users query (what IT dashboard uses)
  console.log('1. Default users query (no parameters):');
  const defaultFilter = {
    status: { $ne: 3 } // By default, exclude deleted users
  };
  
  const defaultCount = await User.countDocuments(defaultFilter);
  console.log('Default count (excludes deleted):', defaultCount);
  
  // Test with role=Student filter
  console.log('\n2. Students only (role=Student):');
  const studentFilter = {
    role: 'Student',
    status: { $ne: 3 }
  };
  
  const studentCount = await User.countDocuments(studentFilter);
  console.log('Student count (excludes deleted):', studentCount);
  
  // Test what happens if someone passes status parameter
  console.log('\n3. Testing potential status parameter issues:');
  
  // Simulate the logic from users.js
  function buildFilter(queryParams) {
    const filter = {
      status: { $ne: 3 } // Default: exclude deleted users
    };
    
    const { status, role } = queryParams;
    
    if (role) {
      filter.role = role;
    }
    
    // Status filter logic from users.js
    if (status) {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'approved') {
        filter.isApproved = true;
      } else if (status === 'pending') {
        filter.isApproved = false;
      }
      // Note: This doesn't handle numeric status values like 3
    }
    
    return filter;
  }
  
  // Test various scenarios
  const scenarios = [
    { role: 'Student' },
    { role: 'Student', status: 'active' },
    { role: 'Student', status: 'pending' },
    { role: 'Student', status: '3' }, // Potential issue
  ];
  
  for (const scenario of scenarios) {
    const filter = buildFilter(scenario);
    const count = await User.countDocuments(filter);
    console.log(`Scenario ${JSON.stringify(scenario)}:`, count, 'users');
    console.log('  Filter:', JSON.stringify(filter, null, 2));
  }
  
  // Check if there are any queries that might include deleted users
  console.log('\n4. Checking for potential deleted user inclusion:');
  
  // Check total students including deleted
  const allStudents = await User.countDocuments({ role: 'Student' });
  const activeStudents = await User.countDocuments({ role: 'Student', status: { $ne: 3 } });
  const deletedStudents = await User.countDocuments({ role: 'Student', status: 3 });
  
  console.log('All students (including deleted):', allStudents);
  console.log('Active students (excluding deleted):', activeStudents);
  console.log('Deleted students (status = 3):', deletedStudents);
  console.log('Verification:', activeStudents + deletedStudents, '=', allStudents);
  
  // Check if IT dashboard might be using a different query
  console.log('\n5. Checking alternative query patterns:');
  
  // Maybe IT is using excludeClassAssigned parameter
  const enquiryFilter = {
    role: 'Student',
    status: { $ne: 3 },
    classId: { $exists: false },
    prospectusStage: { $gte: 1, $lte: 5 }
  };
  
  const enquiryCount = await User.countDocuments(enquiryFilter);
  console.log('Enquiry students (excluding deleted, no class, levels 1-5):', enquiryCount);
  
  process.exit(0);
}

testITEnquiryManagement().catch(console.error);