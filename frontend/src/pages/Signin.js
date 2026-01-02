// src/pages/Signin.js - FINAL COMBINED VERSION
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Signin.css';

// Icons
const UserIcon = () => <span className="icon" aria-hidden="true">👤</span>;
const LockIcon = () => <span className="icon" aria-hidden="true">🔒</span>;
const LoadingSpinner = () => (
  <div className="spinner" role="status" aria-label="Loading">
    <div className="spinner-circle"></div>
  </div>
);

function Signin() {
    const [isStudent, setIsStudent] = useState(true);
    const [admissionId, setAdmissionId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    const { login, user: contextUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

    // Check if user is already logged in
    useEffect(() => {
        // Check localStorage first
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            try {
                const userData = JSON.parse(storedUser);
                // Already logged in, redirect
                if (userData.isAdmin || userData.isLibrarian) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } catch (err) {
                // Invalid stored data, clear it
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    // Load saved credentials from localStorage
    useEffect(() => {
        const savedMethod = localStorage.getItem('lastLoginMethod');
        const savedCredentials = localStorage.getItem('savedCredentials');
        
        if (savedMethod) {
            setIsStudent(savedMethod === 'student');
        }
        
        if (savedCredentials) {
            try {
                const credentials = JSON.parse(savedCredentials);
                if (credentials.admissionId) setAdmissionId(credentials.admissionId);
                if (credentials.employeeId) setEmployeeId(credentials.employeeId);
            } catch (err) {
                console.error('Error loading saved credentials:', err);
                localStorage.removeItem('savedCredentials');
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        
        // Validation
        if (!password.trim()) {
            setError("Please enter password");
            return;
        }

        if (isStudent && !admissionId.trim()) {
            setError("Please enter Admission ID");
            return;
        }

        if (!isStudent && !employeeId.trim()) {
            setError("Please enter Employee ID");
            return;
        }

        setLoading(true);

        const userCredential = isStudent 
            ? { admissionId: admissionId.trim(), password }
            : { employeeId: employeeId.trim(), password };

        try {
            console.log("🔐 Attempting login...");
            
            const response = await axios.post(`${API_URL}/auth/signin`, userCredential, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("✅ Login response:", response.data);
            
            if (response.data.success) {
                const { user, token } = response.data.data;
                
                // Save credentials if "Remember Me" is checked
                if (rememberMe) {
                    const credentials = isStudent 
                        ? { admissionId }
                        : { employeeId };
                    localStorage.setItem('savedCredentials', JSON.stringify(credentials));
                    localStorage.setItem('lastLoginMethod', isStudent ? 'student' : 'staff');
                } else {
                    localStorage.removeItem('savedCredentials');
                    localStorage.removeItem('lastLoginMethod');
                }
                
                // Store in localStorage
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);
                
                // Update context
                login(user, token);
                
                // Redirect based on user type and previous location
                const from = location.state?.from?.pathname || '/dashboard';
                if (user.isAdmin || user.isLibrarian) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
                
            } else {
                throw new Error(response.data.message || "Login failed");
            }
        } catch (err) {
            console.error("❌ Login error:", err);
            
            let errorMessage = "Login failed. Please check your credentials.";
            
            if (err.response?.status === 400) {
                errorMessage = "Invalid credentials. Please try again.";
            } else if (err.response?.status === 401) {
                errorMessage = "Invalid credentials. Please try again.";
            } else if (err.response?.status === 404) {
                errorMessage = "User not found. Please check your ID.";
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = "Request timeout. Please try again.";
            } else if (err.code === 'ECONNREFUSED') {
                errorMessage = "Cannot connect to server. Please check if backend is running.";
            } else if (err.message.includes('Network Error')) {
                errorMessage = "Network error. Please check your internet connection.";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUserTypeChange = (isStudentType) => {
        setIsStudent(isStudentType);
        setError(""); // Clear errors when switching type
        setAdmissionId("");
        setEmployeeId("");
        setPassword("");
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        setError("Please contact the library administrator or librarian to reset your password.");
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl + Enter to submit form
            if (e.ctrlKey && e.key === 'Enter') {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
            }
            // Escape to clear form
            if (e.key === 'Escape') {
                setAdmissionId("");
                setEmployeeId("");
                setPassword("");
                setError("");
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    return (
        <div className='signin-container' role="main">
            <div className="signin-card">
                <div className="signin-header">
                    <h1 id="signin-heading">Welcome Back</h1>
                    <p>Sign in to your library account</p>
                </div>

                <form 
                    onSubmit={handleSubmit} 
                    role="form" 
                    aria-labelledby="signin-heading"
                    noValidate
                >
                    {/* User Type Selection */}
                    <div className="user-type-toggle" role="radiogroup" aria-label="Select user type">
                        <button 
                            type="button"
                            className={isStudent ? 'active' : ''}
                            onClick={() => handleUserTypeChange(true)}
                            disabled={loading}
                            aria-label="Student login"
                        >
                            Student
                        </button>
                        <button 
                            type="button"
                            className={!isStudent ? 'active' : ''}
                            onClick={() => handleUserTypeChange(false)}
                            disabled={loading}
                            aria-label="Staff login"
                        >
                            Staff
                        </button>
                    </div>
                    
                    {/* Error Display */}
                    {error && (
                        <div 
                            className="error-message" 
                            role="alert" 
                            aria-live="assertive"
                            aria-atomic="true"
                        >
                            <span className="error-icon" aria-hidden="true">⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {/* Form Fields */}
                    <div className="form-fields">
                        <div className="form-group">
                            <label htmlFor={isStudent ? "admissionId" : "employeeId"}>
                                <UserIcon />
                                <span className="label-text">
                                    {isStudent ? "Admission ID" : "Employee ID"} *
                                </span>
                            </label>
                            <input 
                                id={isStudent ? "admissionId" : "employeeId"}
                                type="text" 
                                placeholder={isStudent ? "Enter Admission ID" : "Enter Employee ID"} 
                                value={isStudent ? admissionId : employeeId}
                                required 
                                onChange={(e) => { 
                                    isStudent ? setAdmissionId(e.target.value) : setEmployeeId(e.target.value);
                                    setError("");
                                }}
                                aria-required="true"
                                disabled={loading}
                                autoComplete={isStudent ? "username" : "username"}
                                autoFocus
                                aria-describedby={error ? "error-message" : undefined}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <LockIcon />
                                <span className="label-text">Password *</span>
                            </label>
                            <div className="password-input-container">
                                <input 
                                    id="password"
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter Password" 
                                    value={password}
                                    required 
                                    onChange={(e) => { 
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    aria-required="true"
                                    disabled={loading}
                                    autoComplete="current-password"
                                    aria-describedby={error ? "error-message" : undefined}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={loading}
                                    tabIndex="-1"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="form-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Remember me</span>
                            </label>
                            
                            <button 
                                type="button"
                                className="forgot-password"
                                onClick={handleForgotPassword}
                                disabled={loading}
                                aria-label="Forgot password? Contact librarian"
                            >
                                Forgot password?
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        className={`signin-button ${loading ? 'loading' : ''}`}
                        type="submit"
                        disabled={loading}
                        aria-label={loading ? "Signing in..." : "Sign in to your account"}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner />
                                <span>Signing In...</span>
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                {/* Registration and Admin Links */}
                <div className="auth-links">
                    <div className="register-link">
                        <p>
                            Don't have an account?{' '}
                            <Link 
                                to="/register" 
                                className="link"
                                aria-label="Register for a new account"
                            >
                                Register here
                            </Link>
                        </p>
                    </div>
                    
                    <div className="admin-link">
                        <p>
                            Admin/Librarian?{' '}
                            <Link 
                                to="/admin/login" 
                                className="link admin-login-link"
                                aria-label="Go to admin login page"
                            >
                                Click here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signin;