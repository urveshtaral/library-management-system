const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendWelcomeEmail = async (user) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Welcome to Vadodara Central Library',
        html: `
            <h2>Welcome to Vadodara Central Library!</h2>
            <p>Dear ${user.userFullName},</p>
            <p>Your registration was successful. Welcome to our library community!</p>
            <p><strong>Your ID:</strong> ${user.admissionId || user.employeeId}</p>
            <p>We look forward to serving your reading needs.</p>
            <br>
            <p>Best regards,<br>Vadodara Central Library Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', user.email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

const sendOverdueNotification = async (user, book, transaction) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Book Return Overdue - Vadodara Central Library',
        html: `
            <h2>Overdue Book Notice</h2>
            <p>Dear ${user.userFullName},</p>
            <p>The book "<strong>${book.bookName}</strong>" was due on ${new Date(transaction.toDate).toLocaleDateString()}.</p>
            <p>Please return the book at your earliest convenience to avoid additional fines.</p>
            <p><strong>Current Fine:</strong> ₹${transaction.fineAmount}</p>
            <br>
            <p>Thank you,<br>Vadodara Central Library Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Overdue notification sent to:', user.email);
    } catch (error) {
        console.error('Error sending overdue notification:', error);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendOverdueNotification
};