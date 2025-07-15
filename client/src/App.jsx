import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/auth/ProfilePage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Placeholder routes for future pages */}
          <Route path="/institutes" element={
            <ProtectedRoute requiredPermissions={['super_admin']}>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Institute Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute requiredPermissions={['manage_users', 'institute_admin']}>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/students" element={
            <ProtectedRoute requiredPermissions={['manage_students']}>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Student Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/teachers" element={
            <ProtectedRoute requiredPermissions={['manage_teachers']}>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Teacher Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/courses" element={
            <ProtectedRoute requiredPermissions={['manage_courses', 'view_courses']}>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Course Management</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute requiredPermissions={['view_reports']}>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Reports</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;