// src/utils/validation.js

// Original validation functions
export const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validateMobile = (mobile) => {
  return /^\d{10}$/.test(mobile);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateFile = (file, allowedTypes, maxSize) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB` };
  }
  
  return { valid: true, error: null };
};

// New comprehensive validation functions
export const validateForm = (formData, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = formData[field];
    
    if (rules.required && !value) {
      errors[field] = rules.requiredMessage || `${field} is required`;
      return;
    }
    
    if (rules.minLength && value && value.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `Minimum ${rules.minLength} characters required`;
    }
    
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `Invalid ${field} format`;
    }
    
    if (rules.validate && value) {
      const customError = rules.validate(value, formData);
      if (customError) errors[field] = customError;
    }
  });
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

// Example schema for registration:
export const registrationSchema = {
  userFullName: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-Z\s]*$/,
    patternMessage: 'Name can only contain letters and spaces'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Password must contain uppercase, lowercase, and numbers'
  },
  confirmPassword: {
    required: true,
    validate: (value, formData) => {
      if (value !== formData.password) {
        return 'Passwords do not match';
      }
      return null;
    }
  }
};