import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import Layout from './components/layout/Layout';

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

// Institute Admin pages
import EnquiryManagement from './pages/institute-admin/EnquiryManagement';
import StaffManagement from './pages/institute-admin/StaffManagement';
import StudentManagement from './pages/institute-admin/StudentManagement';

// Reports
import ReportsPage from './pages/reports/ReportsPage';
import ITReportsPage from './pages/dashboard/ITReportsPage';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
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

          {/* IT routes */}
          <Route path="/it/students" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['IT']}>
                  <ITDashboard />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/it/reports" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['IT']}>
                  <div className="p-6 mt-20">
                    <ITReportsPage />
                  </div>
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Receptionist routes */}
          <Route path="/receptionist/communications" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/receptionist/directory" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/receptionist/call-logs" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Institute Admin routes */}
          <Route path="/institute-admin/enquiries" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['InstituteAdmin']}>
                  <EnquiryManagement />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/institute-admin/staff" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['InstituteAdmin']}>
                  <StaffManagement />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/institute-admin/students" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['InstituteAdmin']}>
                  <StudentManagement />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Reports */}
          <Route path="/reports" element={
            <AuthenticatedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={['InstituteAdmin', 'CollegeAdmin', 'FinanceAdmin']}>
                  <ReportsPage />
                </RoleBasedRoute>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Advanced Statistics */}
          <Route path="/admin/advanced-statistics" element={
            <AuthenticatedRoute>
              <Layout>
                <AdvancedStatistics />
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Future feature placeholders */}
          <Route path="/institutes" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6 mt-20">
                  <h1 className="text-2xl font-bold">Institute Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/users" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/students" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Student Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/teachers" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Teacher Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </AuthenticatedRoute>
          } />

          <Route path="/courses" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Course Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;