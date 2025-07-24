# 🏫 PGC-DHA School Management System

A comprehensive web-based school management system built for Punjab Group of Colleges (PGC) DHA Campus. This modern solution streamlines student enrollment, class management, attendance tracking, and administrative operations.

## 🚀 Features

### 🔐 **Authentication & Security**
- Multi-role authentication system (SystemAdmin, InstituteAdmin, IT, Teacher, Coordinator, Receptionist, Student)
- JWT-based secure authentication
- Role-based access control (RBAC) with granular permissions
- Password encryption with bcrypt
- Session management and automatic logout

### 👥 **User Management**
- Complete CRUD operations for all user types
- Advanced filtering by role, status, campus, and grade
- Bulk user operations (import/export)
- User status management (Active, Paused, Deleted)
- Profile management with role-specific fields

### 📝 **Enquiry Management**
- **5-Level Enquiry Process:**
  1. **Level 1:** Initial Enquiry Registration
  2. **Level 2:** Documentation & Verification
  3. **Level 3:** Payment Processing
  4. **Level 4:** Interview Scheduling
  5. **Level 5:** Official Admission
- Complete enquiry lifecycle tracking
- Student information collection (Personal, Academic, Family)
- Document management system
- Enquiry analytics and reporting

### 🏫 **Class Management**
- Class creation with campus/grade/program structure
- **4-Floor Organization System:**
  - Floor 1: 11th Grade Boys
  - Floor 2: 12th Grade Boys
  - Floor 3: 11th Grade Girls
  - Floor 4: 12th Grade Girls
- Teacher assignment to classes
- Class capacity management with real-time student counts
- Student roll number generation

### 🎯 **Student Assignment**
- Individual and bulk student assignment to classes
- Grade and program validation
- Assignment status tracking with visual indicators
- Edit and reassignment functionality
- Real-time updates across all modules

### 📊 **Dashboard Systems**

#### **Institute Admin Dashboard**
- Enquiry analytics and conversion tracking
- Student management overview
- Class management quick access
- Comprehensive reporting hub

#### **IT Dashboard**
- System user administration
- Technical support interface
- Advanced user filtering and management

#### **Receptionist Dashboard**
- Enquiry management (Levels 1-3)
- Student information viewing
- Reception-specific operations

### 📈 **Reporting & Analytics**
- Enquiry reports with level-wise analytics
- Student assignment reports
- User management reports
- Export capabilities (CSV, Excel)
- Date range filtering and custom reports

## 🛠️ Technology Stack

### **Frontend**
- **React.js 18** - Modern UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Vite** - Fast build tool and dev server

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **XLSX** - Excel file processing

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart

## 📁 Project Structure

```
PGC-DHA/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── class-management/  # Class management
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── enquiry/       # Enquiry management
│   │   │   ├── layout/        # Layout components
│   │   │   ├── reports/       # Reporting components
│   │   │   ├── ui/            # Reusable UI components
│   │   │   └── user-management/  # User management
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   └── config/            # Configuration files
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── server/                    # Express backend
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   ├── config/                # Server configuration
│   ├── scripts/               # Database scripts
│   ├── services/              # Business logic services
│   ├── utils/                 # Server utilities
│   └── package.json           # Backend dependencies
├── data/                      # Excel import files
│   ├── level 3.xlsx           # Level 3 students data
│   └── NOT RETURN BUT PURCHASED.xlsx
├── LICENSE
└── README.md
```

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn package manager

### **1. Clone the Repository**
```bash
git clone https://github.com/sajidmehmoodtariq30/PGC-DHA.git
cd PGC-DHA
```

### **2. Backend Setup**
```bash
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB service
# Windows: net start MongoDB
# macOS/Linux: sudo systemctl start mongod

# Start the server
npm start
```

### **3. Frontend Setup**
```bash
cd client
npm install

# Start the development server
npm run dev
```

### **4. Environment Variables**

Create `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pgc-dha
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## 📊 Data Import Scripts

### **Level 3 Students Import**
Import existing Level 3 students from Excel file:

```bash
cd server
npm run import:level3
```

**Features of the import script:**
- ✅ Intelligent Excel parsing with flexible column mapping
- ✅ Program normalization (ICS-PHY, ICS-STAT → ICS)
- ✅ Campus assignment based on shift/timing
- ✅ Duplicate detection and prevention
- ✅ Username generation from student names
- ✅ Phone number validation and formatting
- ✅ Comprehensive error handling and reporting

**Supported Excel Columns:**
- Student Name (any variation)
- Father Name
- Program/Class/Group (ICS-PHY, ICS-STAT, FA, etc.)
- Shift/Campus/Timing (Morning/Evening)
- Phone/Contact/Mobile
- Address

## 🔧 Available Scripts

### **Backend (server/)**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run lint       # Run ESLint
npm run import:level3  # Import Level 3 students from Excel
npm run seed       # Seed database with initial data
npm run reset      # Reset database
```

### **Frontend (client/)**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 👤 Default Users

The system comes with default users for testing:

```javascript
// System Administrator
Username: admin
Password: admin123

// Institute Admin  
Username: institute_admin
Password: admin123

// IT User
Username: it_user
Password: admin123
```

## 🔐 Role-Based Permissions

### **SystemAdmin**
- Full system access
- User management
- System configuration

### **InstituteAdmin**
- Complete academic management
- Student and enquiry oversight
- Reporting and analytics

### **IT**
- Technical user management
- System maintenance
- Data management

### **Teacher**
- Class management
- Student assignment
- Attendance tracking

### **Coordinator**
- Floor management
- Student supervision
- Attendance oversight

### **Receptionist**
- Enquiry management (Levels 1-3)
- Basic student information access

## 📊 Key Features Implemented

### ✅ **Completed Modules**
- [x] Authentication & Authorization
- [x] User Management System
- [x] 5-Level Enquiry Process
- [x] Class Management
- [x] Student Assignment System
- [x] Role-based Dashboards
- [x] Comprehensive Reporting
- [x] Real-time Data Updates
- [x] Excel Data Import System

### 🚧 **In Development**
- [ ] Attendance Management
- [ ] Correspondence System
- [ ] Teacher Dashboard Enhancements
- [ ] Coordinator Dashboard
- [ ] Advanced Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and queries:
- **Developer:** Sajid Mehmood Tariq
- **Email:** [Contact Information]
- **Project Repository:** https://github.com/sajidmehmoodtariq30/PGC-DHA

## 🏗️ Architecture

### **Database Schema**
- **Users Collection:** Multi-role user management with enquiry levels
- **Classes Collection:** Class organization and management
- **Sessions:** User authentication sessions

### **API Endpoints**
- `/api/auth/*` - Authentication routes
- `/api/users/*` - User management
- `/api/students/*` - Student operations
- `/api/classes/*` - Class management
- `/api/dashboard/*` - Dashboard data

## 🎯 Future Enhancements

- **Mobile Application** for teachers and coordinators
- **Parent Portal** for student progress tracking
- **SMS/Email Notifications** for important updates
- **Examination Management** system
- **Fee Management** integration
- **Advanced Analytics** and reporting
- **Document Management** system
- **Backup and Recovery** automation

---

**Built with ❤️ for Punjab Group of Colleges DHA Campus**

*Last Updated: July 2025*
