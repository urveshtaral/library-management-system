// src/context/AuthContext.js - FIXED & COMBINED VERSION
import React, { createContext, useReducer, useEffect, useCallback } from 'react';

// Helper functions for localStorage with error handling
const getStoredUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user && user !== 'undefined' && user !== 'null' 
      ? JSON.parse(user) 
      : null;
  } catch (error) {
    console.warn("Error reading user from localStorage:", error);
    localStorage.removeItem("user");
    return null;
  }
};

const getStoredToken = () => {
  try {
    const token = localStorage.getItem("token");
    return token && token !== 'undefined' && token !== 'null' 
      ? token 
      : null;
  } catch (error) {
    console.warn("Error reading token from localStorage:", error);
    localStorage.removeItem("token");
    return null;
  }
};

// Initial state
const INITIAL_STATE = {
  user: getStoredUser(),
  token: getStoredToken(),
  loading: false,
  error: null,
  isAuthenticated: !!getStoredUser()
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { 
        ...state, 
        loading: true, 
        error: null 
      };
    
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        isAuthenticated: true,
        error: null
      };
    
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
        token: null,
        isAuthenticated: false
      };
    
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false
      };
    
    case "UPDATE_USER":
      return { 
        ...state, 
        user: { 
          ...state.user, 
          ...action.payload 
        } 
      };
    
    case "CLEAR_ERROR":
      return { 
        ...state, 
        error: null 
      };
    
    default:
      return state;
  }
};

// Create context
export const AuthContext = createContext(INITIAL_STATE);

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

  // Update localStorage when state changes (with cleanup)
  useEffect(() => {
    if (state.user) {
      try {
        localStorage.setItem('user', JSON.stringify(state.user));
      } catch (error) {
        console.warn("Failed to save user to localStorage:", error);
      }
    } else {
      localStorage.removeItem('user');
    }
    
    if (state.token) {
      try {
        localStorage.setItem('token', state.token);
      } catch (error) {
        console.warn("Failed to save token to localStorage:", error);
      }
    } else {
      localStorage.removeItem('token');
    }
  }, [state.user, state.token]);

  // Action creators
  const login = useCallback((userData, token) => {
    try {
      if (!userData || !token) {
        throw new Error("Invalid login data");
      }
      
      // Validate user data structure
      const validatedUser = {
        _id: userData._id || userData.id || Date.now().toString(),
        userFullName: userData.userFullName || 'User',
        email: userData.email || '',
        userType: userData.userType || 'user',
        isAdmin: userData.isAdmin || false,
        isLibrarian: userData.isLibrarian || false,
        ...userData
      };
      
      dispatch({ 
        type: "LOGIN_SUCCESS", 
        payload: { 
          user: validatedUser, 
          token 
        } 
      });
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      dispatch({ 
        type: "LOGIN_FAILURE", 
        payload: error.message 
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Clear any session data
      sessionStorage.clear();
      
      dispatch({ type: "LOGOUT" });
      
      // Optional: Redirect to home page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    try {
      if (!state.user) {
        throw new Error("No user logged in");
      }
      
      const mergedUser = { 
        ...state.user, 
        ...updatedUser 
      };
      
      dispatch({ 
        type: "UPDATE_USER", 
        payload: mergedUser 
      });
      
      return true;
    } catch (error) {
      console.error("Update user error:", error);
      return false;
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const contextValue = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError,
    dispatch,
    
    // Utilities
    API_URL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
    
    // Quick access methods
    isAdmin: () => state.user?.isAdmin || state.user?.userType === 'admin',
    isLibrarian: () => state.user?.isLibrarian || state.user?.userType === 'librarian',
    isStudent: () => state.user?.userType === 'student',
    isFaculty: () => state.user?.userType === 'faculty',
    hasPermission: (permission) => {
      if (!state.user) return false;
      
      const userPermissions = state.user.permissions || [];
      
      // Admin has all permissions
      if (state.user.isAdmin || state.user.userType === 'admin') {
        return true;
      }
      
      return userPermissions.includes(permission);
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export default for easier imports
export default AuthContext;