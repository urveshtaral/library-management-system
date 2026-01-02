// src/components/ProfileEdit.js - FIXED EXPORT
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './ProfileEdit.css';

// Material-UI Icons (optional)
import PersonIcon from '@material-ui/icons/Person';
import EmailIcon from '@material-ui/icons/Email';
import PhoneIcon from '@material-ui/icons/Phone';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import SchoolIcon from '@material-ui/icons/School';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';

const ProfileEdit = ({ profile, onSave, onCancel }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    userFullName: profile.userFullName || '',
    email: profile.email || '',
    mobileNumber: profile.mobileNumber || '',
    department: profile.department || '',
    course: profile.course || '',
    semester: profile.semester || '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
    gender: profile.gender || '',
    address: profile.address || {
      street: '',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '',
      country: 'India'
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.userFullName.trim()) {
      newErrors.userFullName = 'Full name is required';
    } else if (formData.userFullName.trim().length < 2) {
      newErrors.userFullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
    }

    // Date validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 100);
      
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      } else if (birthDate < minDate) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    // Pincode validation
    if (formData.address.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const userId = profile._id || user?.id || user?._id;
      
      const response = await axios.put(`${API_URL}/users/profile/${userId}`, {
        ...formData,
        mobileNumber: formData.mobileNumber.replace(/\D/g, '') // Clean mobile number
      });
      
      if (response.data.success) {
        setSuccess(true);
        
        // Update global user context
        if (updateUser) {
          updateUser(response.data.data.user);
        }
        
        // Show success message and close after delay
        setTimeout(() => {
          onSave(response.data.data.user);
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      
      if (error.response?.status === 409) {
        setErrors({ email: 'This email is already registered' });
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error updating profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear specific address errors
    if (name === 'address.pincode' && errors.pincode) {
      setErrors(prev => ({
        ...prev,
        pincode: ''
      }));
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({
      ...prev,
      mobileNumber: value
    }));
    
    if (errors.mobileNumber) {
      setErrors(prev => ({
        ...prev,
        mobileNumber: ''
      }));
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        pincode: value
      }
    }));
    
    if (errors.pincode) {
      setErrors(prev => ({
        ...prev,
        pincode: ''
      }));
    }
  };

  const academicDepartments = [
    'Computer Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Electronics & Communication',
    'Information Technology',
    'Chemical Engineering',
    'Biomedical Engineering',
    'Aerospace Engineering',
    'General Studies'
  ];

  const courses = [
    'B.Tech',
    'M.Tech',
    'B.Sc',
    'M.Sc',
    'BBA',
    'MBA',
    'PhD',
    'Diploma',
    'Other'
  ];

  return (
    <div className="profile-edit-modal">
      <div className="edit-form-container">
        <div className="edit-header">
          <div className="header-content">
            <PersonIcon className="header-icon" />
            <h3>Edit Profile</h3>
          </div>
          <button className="close-btn" onClick={onCancel} disabled={loading}>
            <CloseIcon />
          </button>
        </div>
        
        {success && (
          <div className="success-message">
            <SaveIcon className="success-icon" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h4>
              <PersonIcon className="section-icon" />
              Personal Information
            </h4>
            
            <div className="form-group">
              <label>Full Name *</label>
              <div className="input-with-icon">
                <PersonIcon className="input-icon" />
                <input
                  type="text"
                  name="userFullName"
                  value={formData.userFullName}
                  onChange={handleChange}
                  className={errors.userFullName ? 'error' : ''}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
              {errors.userFullName && <span className="error-text">{errors.userFullName}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-with-icon">
                  <EmailIcon className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="your.email@example.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <div className="input-with-icon">
                  <PhoneIcon className="input-icon" />
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleMobileChange}
                    className={errors.mobileNumber ? 'error' : ''}
                    placeholder="9876543210"
                    disabled={loading}
                  />
                </div>
                {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={errors.dateOfBirth ? 'error' : ''}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
                {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {(profile.userType === 'student' || profile.userType === 'faculty') && (
            <div className="form-section">
              <h4>
                <SchoolIcon className="section-icon" />
                Academic Information
              </h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select 
                    name="department" 
                    value={formData.department} 
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {academicDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Course/Program</label>
                  <select 
                    name="course" 
                    value={formData.course} 
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {profile.userType === 'student' && (
                  <div className="form-group">
                    <label>Semester</label>
                    <select 
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
                )}
              </div>
            </div>
          )}

          <div className="form-section">
            <h4>
              <LocationOnIcon className="section-icon" />
              Address Information
            </h4>
            
            <div className="form-group">
              <label>Street Address</label>
              <div className="input-with-icon">
                <LocationOnIcon className="input-icon" />
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="House no, Street, Area"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handlePincodeChange}
                  placeholder="6-digit pincode"
                  className={errors.pincode ? 'error' : ''}
                  disabled={loading}
                />
                {errors.pincode && <span className="error-text">{errors.pincode}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="btn-icon" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        <div className="form-footer">
          <p>
            <strong>Note:</strong> Fields marked with * are required. 
            Your information will be used for library communications and services.
          </p>
        </div>
      </div>
    </div>
  );
};

// ✅ Fix: Export ONLY as default for lazy loading
export default ProfileEdit;