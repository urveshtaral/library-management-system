// src/components/ProtectedRoute.js - UPDATED
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false, librarianOnly = false }) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to signin page with return url
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // Check admin access
    if (adminOnly && !user.isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check librarian access
    if (librarianOnly && !user.isLibrarian && !user.isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}

export default ProtectedRoute;