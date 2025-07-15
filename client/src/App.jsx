import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import Layout from './components/layout/Layout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/auth/ProfilePage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Admin pages
import SuperAdminPage from './pages/admin/SuperAdminPage';
import StudentReport from './pages/admin/StudentReport';

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

          {/* Admin routes */}
          <Route path="/admin" element={
            <AuthenticatedRoute>
              <Layout>
                <SuperAdminPage />
              </Layout>
            </AuthenticatedRoute>
          } />

          {/* Future feature placeholders */}
          <Route path="/institutes" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6">
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

          <Route path="/reports" element={
            <AuthenticatedRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Reports</h1>
                  <StudentReport />
                </div>
              </Layout>
            </AuthenticatedRoute>
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