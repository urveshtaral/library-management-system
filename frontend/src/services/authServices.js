import API from './api';

export const authService = {
    // Login user
    login: async (credentials) => {
        try {
            const response = await API.post('/auth/signin', credentials);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Register user
    register: async (userData) => {
        try {
            const response = await API.post('/auth/register', userData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get current user profile
    getProfile: async (userId) => {
        try {
            const response = await API.get(`/users/profile/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update user profile
    updateProfile: async (userId, userData) => {
        try {
            const response = await API.put(`/users/profile/${userId}`, userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Change password
    changePassword: async (userId, passwordData) => {
        try {
            const response = await API.put(`/users/${userId}/password`, passwordData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Logout user (client-side only)
    logout: () => {
        localStorage.removeItem('user');
        window.location.href = '/signin';
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return !!user;
    },

    // Check if user is admin
    isAdmin: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.isAdmin || false;
    },

    // Get current user
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    }
};

export default authService;