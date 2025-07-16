import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardProvider } from './contexts/DashboardContext';
import ToastContainer from './components/ui/ToastContainer';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import { PERMISSIONS } from './utils/rolePermissions';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/auth/ProfilePage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';
import ITDashboard from './pages/dashboard/ITDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';

// Admin pages
import StudentReport from './pages/admin/StudentReport';
import AdvancedStatistics from './pages/admin/AdvancedStatistics';
import UserManagementContainer from './components/user-management/UserManagementContainer';

// Institute Admin pages
import EnquiryManagementContainer from './components/enquiry/EnquiryManagementContainer';


// Reports
import ReportsContainer from './components/reports/ReportsContainer';
import ITReportsPage from './pages/dashboard/ITReportsPage';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <DashboardProvider>
            <Routes>
          {/* Public routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <AuthenticatedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </AuthenticatedRoute>
          } />
          
          <Route path="/profile" element={
            <AuthenticatedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* IT routes with permission-based protection */}
          <Route path="/it/students" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['IT']}>
                  <ITDashboard />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/it/reports" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['IT']}>
                  <div className="p-6">
                    <ITReportsPage />
                  </div>
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Receptionist routes with permission-based protection */}
          <Route path="/receptionist/communications" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/receptionist/directory" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/receptionist/call-logs" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Institute Admin routes with permission-based protection */}
          <Route path="/institute-admin/enquiries" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT}
                  allowedRoles={['InstituteAdmin', 'IT', 'Receptionist']}
                >
                  <EnquiryManagementContainer />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Reports with proper permission checking */}
          <Route path="/reports" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermissions={[
                    PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
                    PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS,
                    PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS,
                    PERMISSIONS.REPORTS.VIEW_EXAMINATION_REPORTS,
                    PERMISSIONS.REPORTS.VIEW_CORRESPONDENCE_REPORTS,
                    PERMISSIONS.REPORTS.VIEW_APPOINTMENT_REPORTS
                  ]}
                  requireAll={false}
                  allowedRoles={['InstituteAdmin', 'IT']}
                >
                  <ReportsContainer />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Advanced Statistics - Institute Admin only */}
          <Route path="/admin/advanced-statistics" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['InstituteAdmin']}>
                  <AdvancedStatistics />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* User Management routes */}
          <Route path="/admin/users" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.USER_MANAGEMENT.VIEW_USERS}
                  allowedRoles={['InstituteAdmin', 'IT']}
                >
                  <UserManagementContainer />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/admin/add-student" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT}
                  allowedRoles={['InstituteAdmin', 'IT', 'Receptionist']}
                >
                  <UserManagementContainer />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Legacy route - redirect to new user management */}
          <Route path="/institute-admin/staff" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.MANAGEMENT.STAFF_MANAGEMENT}
                  allowedRoles={['InstituteAdmin']}
                >
                  <UserManagementContainer />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Correspondence routes */}
          <Route path="/correspondence" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermissions={[
                    PERMISSIONS.CORRESPONDENCE.VIEW_ENQUIRY_CORRESPONDENCE,
                    PERMISSIONS.CORRESPONDENCE.VIEW_STUDENT_CORRESPONDENCE
                  ]}
                  requireAll={false}
                  allowedRoles={['InstituteAdmin', 'IT', 'Receptionist']}
                >
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Correspondence Management</h1>
                    <p className="text-gray-600">Coming soon...</p>
                  </div>
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/correspondence/add" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermissions={[
                    PERMISSIONS.CORRESPONDENCE.ADD_ENQUIRY_CORRESPONDENCE,
                    PERMISSIONS.CORRESPONDENCE.ADD_STUDENT_CORRESPONDENCE
                  ]}
                  requireAll={false}
                  allowedRoles={['InstituteAdmin', 'IT', 'Receptionist']}
                >
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Add Correspondence</h1>
                    <p className="text-gray-600">Coming soon...</p>
                  </div>
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Future feature placeholders with proper protection */}
          <Route path="/institutes" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['InstituteAdmin']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Institute Management</h1>
                    <p className="text-gray-600">Coming soon...</p>
                  </div>
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/users" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.USER_MANAGEMENT.VIEW_USERS}
                  allowedRoles={['InstituteAdmin', 'IT']}
                >
                  <UserManagementContainer />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/students" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.MANAGEMENT.STUDENT_MANAGEMENT}
                  allowedRoles={['InstituteAdmin']}
                >
                  <UserManagementContainer userType="student" />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/teachers" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute 
                  requiredPermission={PERMISSIONS.MANAGEMENT.STAFF_MANAGEMENT}
                  allowedRoles={['InstituteAdmin']}
                >
                  <UserManagementContainer userType="staff" />
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/courses" element={
            <AuthenticatedRoute>
              <Layout>
                <ProtectedRoute allowedRoles={['InstituteAdmin', 'Teacher']}>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Course Management</h1>
                    <p className="text-gray-600">Coming soon...</p>
                  </div>
                </ProtectedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
          </DashboardProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
