// backend/utils/validators.js
const Joi = require('joi');

const validateRegister = (data) => {
  const schema = Joi.object({
    userType: Joi.string().valid('student', 'staff', 'admin', 'librarian').required(),
    userFullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    mobileNumber: Joi.string().pattern(/^\d{10}$/).required(),
  });
  return schema.validate(data);
};

module.exports = { validateRegister };