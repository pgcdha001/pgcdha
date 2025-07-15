import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    console.log('API Request interceptor:', { 
      url: config.url, 
      method: config.method,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response success:', { 
      url: response.config.url, 
      status: response.status,
      success: response.data?.success 
    });
    return response;
  },
  async (error) => {
    console.error('API Response error:', { 
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          console.log('Attempting token refresh...');
          const response = await refreshAccessToken();
          if (response.success) {
            setAccessToken(response.data.accessToken);
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token management functions
export const setAccessToken = (token) => {
  console.log('Setting access token:', { token: !!token });
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAccessToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('Getting access token:', { token: !!token });
  return token;
};

export const setRefreshToken = (token) => {
  if (token) {
    // Store refresh token in httpOnly cookie for security
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      expires: 7, // 7 days
      httpOnly: false, // Set to true in production with proper backend support
      secure: import.meta.env.PROD,
      sameSite: 'strict'
    });
  } else {
    Cookies.remove(REFRESH_TOKEN_KEY);
  }
};

export const getRefreshToken = () => {
  return Cookies.get(REFRESH_TOKEN_KEY);
};

export const setUserData = (userData) => {
  if (userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// Authentication API methods
export const authAPI = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { tokens, user } = response.data.data;
        console.log('Login response:', { tokens: !!tokens, user: !!user });
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        setUserData(user);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setUserData(user);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearTokens();
    }
  },

  // Logout from all devices
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all API error:', error);
    } finally {
      clearTokens();
    }
  },

  // Refresh access token
  refreshToken: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        setAccessToken(response.data.data.accessToken);
      }
      
      return response.data;
    } catch (error) {
      clearTokens();
      throw error.response?.data || { message: 'Token refresh failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        setUserData(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password change failed' };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset request failed' };
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  // Verify reset password token
  verifyResetToken: async (token) => {
    try {
      const response = await api.post('/auth/verify-reset-token', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify reset token' };
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      if (response.data.success) {
        setUserData(response.data.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Get active sessions
  getSessions: async () => {
    try {
      const response = await api.get('/auth/sessions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get sessions' };
    }
  },

  // Revoke specific session
  revokeSession: async (sessionId) => {
    try {
      const response = await api.delete(`/auth/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to revoke session' };
    }
  }
};

// User API methods
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      
      if (response.data.success) {
        setUserData(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Get users by institute
  getUsers: async (params = {}) => {
    try {
      console.log('getUsers called with params:', params);
      const response = await api.get('/users', { params });
      console.log('getUsers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getUsers error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to get users' };
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      console.log('Calling deleteUser API with id:', id);
      const response = await api.delete(`/users/${id}`);
      console.log('deleteUser response:', response.data);
      return response.data;
    } catch (error) {
      console.error('deleteUser error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  // Get user by ID
  getUser: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user' };
    }
  },

  // Update user status
  updateUserStatus: async (id, statusData) => {
    try {
      const response = await api.patch(`/users/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user status' };
    }
  },

  // Approve user
  approveUser: async (id) => {
    try {
      const response = await api.patch(`/users/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve user' };
    }
  },

  // Suspend user
  suspendUser: async (id, reason) => {
    try {
      const response = await api.patch(`/users/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to suspend user' };
    }
  },

  // Activate user
  activateUser: async (id) => {
    try {
      const response = await api.patch(`/users/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to activate user' };
    }
  }
};

// Helper function for refresh token
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
    refreshToken
  });

  return response.data;
};

// Export aliases for consistency
export const authApi = authAPI;
export const userApi = userAPI;

// Export the configured axios instance
export default api;
