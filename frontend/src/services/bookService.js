import API from './api';

export const bookService = {
    // Get all books with optional filters
    getAllBooks: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            
            // Add filters to params
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });

            const response = await API.get(`/books/allbooks?${params}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get book by ID
    getBookById: async (bookId) => {
        try {
            const response = await API.get(`/books/${bookId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Add new book (admin only)
    addBook: async (bookData) => {
        try {
            const formData = new FormData();
            
            // Append all book data to formData
            Object.keys(bookData).forEach(key => {
                if (key === 'categories' || key === 'tags') {
                    // Convert arrays to strings
                    formData.append(key, bookData[key].join(','));
                } else if (key === 'coverImage' && bookData[key]) {
                    // Handle file upload
                    formData.append('coverImage', bookData[key]);
                } else {
                    formData.append(key, bookData[key]);
                }
            });

            const response = await API.post('/books/addbook', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update book (admin only)
    updateBook: async (bookId, bookData) => {
        try {
            const formData = new FormData();
            
            Object.keys(bookData).forEach(key => {
                if (key === 'categories' || key === 'tags') {
                    formData.append(key, bookData[key].join(','));
                } else if (key === 'coverImage' && bookData[key]) {
                    formData.append('coverImage', bookData[key]);
                } else {
                    formData.append(key, bookData[key]);
                }
            });

            const response = await API.put(`/books/${bookId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Delete book (admin only)
    deleteBook: async (bookId) => {
        try {
            const response = await API.delete(`/books/${bookId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Search books
    searchBooks: async (query, filters = {}) => {
        try {
            const params = new URLSearchParams({
                search: query,
                ...filters
            });

            const response = await API.get(`/books/allbooks?${params}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get books by category
    getBooksByCategory: async (category) => {
        try {
            const response = await API.get(`/categories/${category}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get all categories
    getAllCategories: async () => {
        try {
            const response = await API.get('/categories/all');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Issue a book
    issueBook: async (bookId, borrowerId, days = 14) => {
        try {
            const response = await API.post('/transactions/issue', {
                bookId,
                borrowerId,
                days
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Return a book
    returnBook: async (transactionId) => {
        try {
            const response = await API.post('/transactions/return', {
                transactionId
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get user's active transactions
    getUserTransactions: async (userId) => {
        try {
            const response = await API.get(`/users/profile/${userId}`);
            return response.data.activeTransactions || [];
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Add to wishlist
    addToWishlist: async (userId, bookId) => {
        try {
            const response = await API.put(`/users/${userId}/wishlist`, { bookId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Remove from wishlist
    removeFromWishlist: async (userId, bookId) => {
        try {
            const response = await API.delete(`/users/${userId}/wishlist/${bookId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Rate a book
    rateBook: async (bookId, rating, comment = '') => {
        try {
            const response = await API.post(`/books/${bookId}/rate`, {
                rating,
                comment
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default bookService;