// src/pages/Register.js - UPDATED VERSION
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    userType: 'student',
    userFullName: '',
    admissionId: '',
    employeeId: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    course: '',
    semester: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
      setError("Mobile number must be 10 digits");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData);
      
      if (response.data.success) {
        alert('Registration successful! Please sign in.');
        navigate('/signin');
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Validation failed');
      } else if (err.response?.status === 409) {
        setError('Email or ID already registered');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleUserTypeChange = (type) => {
    setFormData({
      ...formData,
      userType: type,
      admissionId: type === 'student' ? formData.admissionId : '',
      employeeId: type !== 'student' ? formData.employeeId : '',
      department: type === 'student' ? formData.department : '',
      course: type === 'student' ? formData.course : '',
      semester: type === 'student' ? formData.semester : ''
    });
  }

  return (
    <div className='register-container'>
      <div className="register-card">
        <div className="register-header">
          <h1>Join Our Library</h1>
          <p>Create your account to access thousands of books</p>
        </div>

        <form onSubmit={handleSubmit} role="form" aria-labelledby="register-heading">
          {error && (
            <div className="error-message" role="alert" aria-live="polite">
              <p>{error}</p>
            </div>
          )}

          <fieldset className="form-group">
            <legend>I am a:</legend>
            <div className="user-type-selector" role="radiogroup" aria-label="Select user type">
              <button
                type="button"
                className={formData.userType === 'student' ? 'active' : ''}
                onClick={() => handleUserTypeChange('student')}
                aria-pressed={formData.userType === 'student'}
                aria-label="Student account"
              >
                Student
              </button>
              <button
                type="button"
                className={formData.userType === 'staff' ? 'active' : ''}
                onClick={() => handleUserTypeChange('staff')}
                aria-pressed={formData.userType === 'staff'}
                aria-label="Staff account"
              >
                Staff
              </button>
            </div>
          </fieldset>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userFullName">Full Name *</label>
              <input
                id="userFullName"
                type="text"
                name="userFullName"
                value={formData.userFullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                aria-required="true"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor={formData.userType === 'student' ? 'admissionId' : 'employeeId'}>
                {formData.userType === 'student' ? 'Admission ID *' : 'Employee ID *'}
              </label>
              <input
                id={formData.userType === 'student' ? 'admissionId' : 'employeeId'}
                type="text"
                name={formData.userType === 'student' ? 'admissionId' : 'employeeId'}
                value={formData.userType === 'student' ? formData.admissionId : formData.employeeId}
                onChange={handleChange}
                required
                placeholder={formData.userType === 'student' ? 'Enter admission ID' : 'Enter employee ID'}
                aria-required="true"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                aria-required="true"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber">Mobile Number *</label>
              <input
                id="mobileNumber"
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                aria-required="true"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 6 characters"
                minLength="6"
                aria-required="true"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                aria-required="true"
                disabled={loading}
              />
            </div>
          </div>

          {formData.userType === 'student' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select 
                  id="department"
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <select 
                  id="semester"
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
            aria-label={loading ? "Creating account..." : "Create new library account"}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="login-redirect">
            <p>Already have an account? <Link to="/signin" aria-label="Go to sign in page">Sign In</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;