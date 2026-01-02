// Format date to readable string
export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format time
export const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
};

// Truncate text
export const truncateText = (text, length = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

// Generate random color
export const getRandomColor = () => {
    const colors = [
        '#ff6b35', '#667eea', '#764ba2', '#f093fb', 
        '#4facfe', '#43e97b', '#ffd166', '#06d6a0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Validate email
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate phone number
export const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
};