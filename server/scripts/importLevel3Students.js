const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pgc-dha', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Program mapping - normalize variations to standard programs
const normalizeProgram = (program) => {
  if (!program || typeof program !== 'string') return 'Not Provided';
  
  const prog = program.toString().toUpperCase().trim();
  
  // Map variations to standard programs
  if (prog.includes('ICS-PHY') || prog.includes('ICS PHY') || prog.includes('ICSPHY')) {
    return 'ICS';
  }
  if (prog.includes('ICS-STAT') || prog.includes('ICS STAT') || prog.includes('ICSSTAT')) {
    return 'ICS';
  }
  if (prog.includes('ICS') && !prog.includes('PHY') && !prog.includes('STAT')) {
    return 'ICS';
  }
  if (prog.includes('ICOM') || prog.includes('I.COM') || prog.includes('I-COM')) {
    return 'ICOM';
  }
  if (prog.includes('PRE ENG') || prog.includes('PRE-ENG') || prog.includes('PREENG') || prog.includes('PRE ENGINEERING')) {
    return 'Pre Engineering';
  }
  if (prog.includes('PRE MED') || prog.includes('PRE-MED') || prog.includes('PREMED') || prog.includes('PRE MEDICAL')) {
    return 'Pre Medical';
  }
  if (prog.includes('FA') || prog.includes('F.A') || prog.includes('F-A')) {
    return 'FA';
  }
  
  // If no match found, return original value but ensure it's in our enum
  return 'ICS'; // Default fallback
};

// Normalize shift to campus
const normalizeCampus = (shift) => {
  if (!shift || typeof shift !== 'string') return 'Boys';
  
  const shiftStr = shift.toString().toLowerCase().trim();
  
  if (shiftStr.includes('morning') || shiftStr.includes('male') || shiftStr.includes('boy')) {
    return 'Boys';
  }
  if (shiftStr.includes('evening') || shiftStr.includes('female') || shiftStr.includes('girl')) {
    return 'Girls';
  }
  
  return 'Boys'; // Default fallback
};

// Generate username from name
const generateUsername = (firstName, lastName, fatherName) => {
  const first = firstName ? firstName.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const last = lastName ? lastName.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const father = fatherName ? fatherName.toString().toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3) : '';
  
  const baseUsername = `${first}${last}${father}`.substring(0, 15);
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${baseUsername}${randomSuffix}`;
};

// Clean and validate phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return 'Not Provided';
  
  const phoneStr = phone.toString().replace(/[^0-9]/g, '');
  
  // Pakistan phone number validation
  if (phoneStr.length === 11 && phoneStr.startsWith('0')) {
    return phoneStr;
  }
  if (phoneStr.length === 10) {
    return '0' + phoneStr;
  }
  if (phoneStr.length === 13 && phoneStr.startsWith('92')) {
    return '0' + phoneStr.substring(2);
  }
  
  return phoneStr || 'Not Provided';
};

// Parse Excel file
const parseExcelFile = (filePath) => {
  try {
    console.log('📖 Reading Excel file:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header mapping
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file appears to be empty or invalid');
    }
    
    // Get headers from first row
    const headers = jsonData[0];
    console.log('📋 Excel Headers:', headers);
    
    // Convert rows to objects
    const students = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const studentData = {};
      
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          studentData[header.toString().trim()] = row[index];
        }
      });
      
      // Only process rows that have meaningful data
      if (studentData && Object.keys(studentData).length > 0) {
        students.push(studentData);
      }
    }
    
    console.log(`📊 Found ${students.length} student records in Excel`);
    return students;
    
  } catch (error) {
    console.error('❌ Error parsing Excel file:', error);
    throw error;
  }
};

// Map Excel data to User schema
const mapExcelToUserSchema = (excelData) => {
  const mapped = [];
  
  for (const row of excelData) {
    try {
      // Try to extract student name - look for common column names
      let firstName = 'Not Provided';
      let lastName = 'Not Provided';
      let fatherName = 'Not Provided';
      let program = 'ICS';
      let campus = 'Boys';
      let phoneNumber = 'Not Provided';
      let address = 'Not Provided';
      
      // Map based on common column patterns
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        const value = row[key];
        
        // Student Name mapping
        if (lowerKey.includes('student') && lowerKey.includes('name') && value) {
          const fullName = value.toString().trim();
          const nameParts = fullName.split(' ');
          firstName = nameParts[0] || 'Not Provided';
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Not Provided';
        }
        
        // Father Name mapping
        if (lowerKey.includes('father') && value) {
          fatherName = value.toString().trim();
        }
        
        // Program mapping
        if ((lowerKey.includes('program') || lowerKey.includes('class') || lowerKey.includes('group')) && value) {
          program = normalizeProgram(value);
        }
        
        // Campus/Shift mapping
        if ((lowerKey.includes('shift') || lowerKey.includes('campus') || lowerKey.includes('timing')) && value) {
          campus = normalizeCampus(value);
        }
        
        // Phone mapping
        if ((lowerKey.includes('phone') || lowerKey.includes('contact') || lowerKey.includes('mobile')) && value) {
          phoneNumber = cleanPhoneNumber(value);
        }
        
        // Address mapping
        if (lowerKey.includes('address') && value) {
          address = value.toString().trim();
        }
      });
      
      // Generate unique username
      const userName = generateUsername(firstName, lastName, fatherName);
      
      // Create user object
      const userObject = {
        userName,
        email: `${userName}@pgc.edu.pk`, // Generate email
        password: 'student123', // Default password
        fullName: {
          firstName,
          lastName
        },
        role: 'Student',
        status: 1,
        phoneNumber,
        address: address !== 'Not Provided' ? address : undefined,
        program,
        gender: campus === 'Girls' ? 'Female' : 'Male',
        fatherName,
        campus,
        enquiryLevel: 3, // Level 3 as per requirement
        prospectusStage: 3,
        isActive: true,
        isApproved: false,
        createdOn: new Date(),
        updatedOn: new Date()
      };
      
      mapped.push(userObject);
      
    } catch (error) {
      console.error('⚠️ Error mapping row:', error, 'Row data:', row);
    }
  }
  
  console.log(`✅ Successfully mapped ${mapped.length} students`);
  return mapped;
};

// Import students to database
const importStudents = async (students) => {
  const results = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };
  
  for (const student of students) {
    try {
      // Check if student already exists
      const existingUser = await User.findOne({
        $or: [
          { userName: student.userName },
          { email: student.email },
          { 
            'fullName.firstName': student.fullName.firstName,
            'fullName.lastName': student.fullName.lastName,
            fatherName: student.fatherName
          }
        ]
      });
      
      if (existingUser) {
        console.log(`⚠️ Duplicate student found: ${student.fullName.firstName} ${student.fullName.lastName}`);
        results.duplicates++;
        continue;
      }
      
      // Create new student
      const newStudent = new User(student);
      await newStudent.save();
      
      console.log(`✅ Added student: ${student.fullName.firstName} ${student.fullName.lastName} (${student.userName})`);
      results.success++;
      
    } catch (error) {
      console.error(`❌ Failed to add student: ${student.fullName?.firstName} ${student.fullName?.lastName}`, error.message);
      results.failed++;
      results.errors.push({
        student: `${student.fullName?.firstName} ${student.fullName?.lastName}`,
        error: error.message
      });
    }
  }
  
  return results;
};

// Main execution function
const main = async () => {
  try {
    console.log('🚀 Starting Level 3 Students Import Process');
    
    // Connect to database
    await connectDB();
    
    // Parse Excel file
    const excelPath = path.join(__dirname, '../../data/level 3.xlsx');
    const excelData = parseExcelFile(excelPath);
    
    if (excelData.length === 0) {
      console.log('⚠️ No student data found in Excel file');
      return;
    }
    
    // Map Excel data to User schema
    const mappedStudents = mapExcelToUserSchema(excelData);
    
    if (mappedStudents.length === 0) {
      console.log('⚠️ No students could be mapped from Excel data');
      return;
    }
    
    // Import students
    console.log(`📥 Importing ${mappedStudents.length} students...`);
    const results = await importStudents(mappedStudents);
    
    // Print results
    console.log('\n📊 Import Results:');
    console.log(`✅ Successfully imported: ${results.success} students`);
    console.log(`⚠️ Duplicates skipped: ${results.duplicates} students`);
    console.log(`❌ Failed imports: ${results.failed} students`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`   - ${error.student}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Import process completed!');
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('🔒 Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  parseExcelFile,
  mapExcelToUserSchema,
  importStudents,
  normalizeProgram,
  normalizeCampus
};
