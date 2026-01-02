const Joi = require('joi');

// User registration validation
const registerValidation = (data) => {
    const schema = Joi.object({
        userType: Joi.string().valid('student', 'staff', 'admin', 'librarian').required(),
        userFullName: Joi.string().min(2).max(100).required(),
        admissionId: Joi.when('userType', {
            is: 'student',
            then: Joi.string().min(3).max(15).required(),
            otherwise: Joi.string().allow('', null)
        }),
        employeeId: Joi.when('userType', {
            is: Joi.string().valid('staff', 'admin', 'librarian'),
            then: Joi.string().min(3).max(15).required(),
            otherwise: Joi.string().allow('', null)
        }),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        mobileNumber: Joi.string().pattern(/^\d{10}$/).required(),
        age: Joi.number().min(1).max(120),
        gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say'),
        department: Joi.string().max(100),
        course: Joi.string().max(100),
        semester: Joi.number().min(1).max(8)
    });

    return schema.validate(data);
};

// Book validation
const bookValidation = (data) => {
    const schema = Joi.object({
        isbn: Joi.string().required(),
        bookName: Joi.string().min(1).max(255).required(),
        author: Joi.string().min(1).max(255).required(),
        bookCountAvailable: Joi.number().min(0).required(),
        totalCopies: Joi.number().min(1).required(),
        categories: Joi.array().items(Joi.string()),
        publicationYear: Joi.number().min(1800).max(new Date().getFullYear()),
        publisher: Joi.string().max(255),
        language: Joi.string().max(50),
        description: Joi.string().max(1000)
    });

    return schema.validate(data);
};

// Event validation
const eventValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        description: Joi.string().min(1).max(1000).required(),
        date: Joi.date().required(),
        type: Joi.string().valid(
            'Competition', 'Quiz', 'Workshop', 'Seminar', 
            'Book Launch', 'Author Talk', 'Reading Session'
        ).required(),
        maxParticipants: Joi.number().min(1).max(1000),
        location: Joi.string().max(255)
    });

    return schema.validate(data);
};

module.exports = {
    registerValidation,
    bookValidation,
    eventValidation
};