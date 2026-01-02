// Utility functions
const generateAdmissionId = () => {
    const prefix = 'STU';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
};

const generateEmployeeId = () => {
    const prefix = 'EMP';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
};

const calculateFine = (dueDate, returnDate) => {
    const due = new Date(dueDate);
    const returned = new Date(returnDate);
    
    if (returned <= due) return 0;
    
    const daysLate = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
    return daysLate * 5; // ₹5 per day
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

module.exports = {
    generateAdmissionId,
    generateEmployeeId,
    calculateFine,
    formatDate
};