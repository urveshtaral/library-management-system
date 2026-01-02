// src/components/AdminLogin.js - COMPLETE FIXED VERSION
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';

import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

function AdminLogin() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return;
        }

        setLoading(true);

        try {
            console.log("🔐 Attempting admin login...");
            
            const response = await axios.post(`${API_URL}/auth/admin-login`, formData);
            
            console.log("✅ Admin login response:", response.data);
            
            if (response.data.success) {
                const { user, token } = response.data.data;
                
                // Store in localStorage
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', token);
                
                // Update context
                login(user, token);
                
                // Redirect to admin dashboard
                navigate('/admin');
            } else {
                setError(response.data.message || 'Admin login failed');
            }
            
        } catch (err) {
            console.error("❌ Admin login error:", err);
            
            let errorMessage = "Admin login failed";
            
            if (err.response?.status === 401 || err.response?.status === 400) {
                errorMessage = "Invalid email or password";
            } else if (err.response?.status === 403) {
                errorMessage = "Account is deactivated or not authorized";
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message.includes('Network Error')) {
                errorMessage = "Cannot connect to server. Please check if backend is running.";
            } else if (err.code === 'ECONNREFUSED') {
                errorMessage = "Cannot connect to server. Please start the backend server.";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <AdminPanelSettingsIcon className="admin-icon" />
                    <h2>Admin/Librarian Login</h2>
                    <p>Access library management system</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">
                            <EmailIcon className="input-icon" />
                            Admin/Librarian Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter admin or librarian email"
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <LockIcon className="input-icon" />
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter password"
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="admin-login-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Admin/Librarian Sign In'}
                    </button>
                </form>

                <div className="back-to-main">
                    <p>
                        Regular user?{' '}
                        <a href="/signin" className="back-link">
                            Sign in here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;