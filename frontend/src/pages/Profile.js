// src/pages/Profile.js - FIXED & OPTIMIZED VERSION
import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

// Icons - Keep only essential ones to reduce bundle size
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookIcon from '@mui/icons-material/Book';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import TimerIcon from '@mui/icons-material/Timer';

// Lazy load the ProfileEdit component to prevent circular dependencies
const ProfileEdit = lazy(() => import('../components/ProfileEdit'));

function Profile() {
    const { user, updateUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [stats, setStats] = useState({
        activeBooks: 0,
        totalBooks: 0,
        wishlistCount: 0,
        points: 0,
        pendingFines: 0
    });

    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

    // Get user ID from context - SIMPLIFIED
    const getUserId = () => {
        if (!user) return null;
        return user?._id || user?.id;
    };

    // Get token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    useEffect(() => {
        console.log('🔍 Profile Component - User Context:', user);
        
        // Redirect if not authenticated
        if (!user) {
            setError('Please sign in to view your profile');
            setLoading(false);
            setTimeout(() => navigate('/signin'), 1500);
            return;
        }

        const userId = getUserId();
        const token = getAuthToken();
        
        if (userId && token) {
            fetchProfile(userId, token);
        } else {
            setError('Authentication required');
            setLoading(false);
        }
    }, [user, navigate]);

    // Simplified profile fetch
    const fetchProfile = async (userId, token) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 Fetching profile for user ID:', userId);
            
            // Try primary endpoint first
            const response = await axios.get(`${API_URL}/users/profile/${userId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                timeout: 10000 // 10 second timeout
            });
            
            console.log('✅ Profile API Response:', response.data);
            
            if (response.data.success) {
                // Extract profile data
                let profileData = null;
                if (response.data.data?.user) {
                    profileData = response.data.data.user;
                } else if (response.data.data) {
                    profileData = response.data.data;
                } else {
                    profileData = response.data;
                }
                
                if (profileData) {
                    setProfile(profileData);
                    calculateStatistics(profileData);
                    
                    // Update context with fresh data
                    if (updateUser) {
                        updateUser(profileData);
                    }
                } else {
                    throw new Error('No profile data received');
                }
            } else {
                throw new Error(response.data.message || 'Failed to fetch profile');
            }
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            handleFetchError(error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics
    const calculateStatistics = (profileData) => {
        const activeTransactions = profileData.activeTransactions || [];
        const prevTransactions = profileData.prevTransactions || [];
        const wishlist = profileData.wishlist || [];
        
        // Calculate fines
        let pendingFines = 0;
        activeTransactions.forEach(transaction => {
            if (transaction.fineAmount && !transaction.finePaid) {
                pendingFines += transaction.fineAmount;
            }
        });
        
        setStats({
            activeBooks: activeTransactions.length,
            totalBooks: prevTransactions.length + activeTransactions.length,
            wishlistCount: wishlist.length,
            points: profileData.points || 0,
            pendingFines
        });
    };

    // Error handling
    const handleFetchError = (error) => {
        let errorMessage = 'Failed to load profile';
        
        if (error.response?.status === 401) {
            errorMessage = 'Session expired. Please login again.';
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setTimeout(() => navigate('/signin'), 1000);
        } else if (error.response?.status === 404) {
            errorMessage = 'Profile not found.';
        } else if (error.message.includes('Network Error')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout. Please try again.';
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        setError(errorMessage);
        
        // Fallback to context data if available
        if (user && !profile) {
            console.log('Using context data as fallback');
            setProfile(user);
            calculateStatistics(user);
            setError(null);
        }
    };

    // Handle edit profile
    const handleEdit = () => {
        setEditing(true);
    };

    // Handle save profile
    const handleSave = async (updatedProfile) => {
        try {
            const userId = getUserId();
            const token = getAuthToken();
            
            if (!userId || !token) {
                throw new Error('Authentication required');
            }
            
            const response = await axios.put(
                `${API_URL}/users/profile/${userId}`,
                updatedProfile,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
                const newProfile = response.data.data?.user || response.data.data || response.data;
                setProfile(newProfile);
                setEditing(false);
                calculateStatistics(newProfile);
                
                if (updateUser) {
                    updateUser(newProfile);
                }
                
                // Show success message
                alert('Profile updated successfully!');
            } else {
                throw new Error(response.data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.message || 'Error updating profile');
        }
    };

    const handleCancel = () => {
        setEditing(false);
    };

    const handleRetry = () => {
        const userId = getUserId();
        const token = getAuthToken();
        if (userId && token) {
            fetchProfile(userId, token);
        } else {
            navigate('/signin');
        }
    };

    // Utility functions
    const getSafeValue = (value, fallback = 'Not provided') => {
        return value !== undefined && value !== null && value !== '' ? value : fallback;
    };

    const getUserIdDisplay = () => {
        return getSafeValue(
            profile?.admissionId || profile?.employeeId || profile?._id?.slice(-8) || profile?.id?.slice(-8),
            'N/A'
        );
    };

    const getUserTypeDisplay = () => {
        if (profile?.isAdmin) return 'Admin';
        if (profile?.userType) return profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1);
        return 'User';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h3>Loading Your Profile...</h3>
                    <p>Please wait while we fetch your information</p>
                    <button onClick={handleRetry} className="retry-btn">
                        <RefreshIcon /> Retry
                    </button>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !profile) {
        return (
            <div className="profile-page">
                <div className="error-container">
                    <WarningIcon style={{ fontSize: 60, color: '#f39c12' }} />
                    <h2>Profile Load Error</h2>
                    <p className="error-message">{error}</p>
                    <div className="error-actions">
                        <button onClick={handleRetry} className="retry-btn">
                            <RefreshIcon /> Try Again
                        </button>
                        <button onClick={() => navigate('/signin')} className="login-btn">
                            Go to Login
                        </button>
                        <button onClick={() => navigate('/')} className="home-btn">
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No profile data state
    if (!profile) {
        return (
            <div className="profile-page">
                <div className="no-profile-container">
                    <PersonIcon style={{ fontSize: 80, color: '#95a5a6' }} />
                    <h3>No Profile Found</h3>
                    <p>We couldn't load your profile information.</p>
                    <div className="profile-actions">
                        <button onClick={handleRetry} className="retry-btn">
                            <RefreshIcon /> Reload Profile
                        </button>
                        <button onClick={() => navigate('/signin')} className="login-btn">
                            Sign In Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success state - Profile loaded
    return (
        <div className="profile-page">
            {/* Edit Profile Modal with Suspense */}
            {editing && (
                <Suspense fallback={
                    <div className="edit-modal-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading editor...</p>
                    </div>
                }>
                    <ProfileEdit 
                        profile={profile}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </Suspense>
            )}

            {/* Profile Header */}
            <div className="profile-header">
                <div className="container">
                    <div className="profile-info">
                        <div className="profile-avatar">
                            {profile.photo ? (
                                <img 
                                    src={`${API_URL.replace('/api', '')}${profile.photo}`}
                                    alt={profile.userFullName}
                                    className="avatar-image"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className="avatar-fallback">
                                <PersonIcon />
                            </div>
                            {stats.activeBooks > 0 && (
                                <span className="active-books-badge">
                                    {stats.activeBooks}
                                </span>
                            )}
                        </div>
                        
                        <div className="profile-details">
                            <h1>{getSafeValue(profile.userFullName, 'Library User')}</h1>
                            <p className="profile-role">
                                <span className="user-type">
                                    <PersonIcon /> {getUserTypeDisplay()}
                                </span>
                                {profile.department && (
                                    <span className="department">
                                        <SchoolIcon /> {profile.department}
                                    </span>
                                )}
                                {profile.course && <span className="course"> • {profile.course}</span>}
                                {profile.semester && <span className="semester"> • Semester {profile.semester}</span>}
                            </p>
                            <p className="profile-id">
                                <span className="id-label">Library ID:</span> {getUserIdDisplay()}
                            </p>
                            
                            <div className="profile-stats">
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <BookIcon />
                                    </div>
                                    <div className="stat-content">
                                        <strong>{stats.activeBooks}</strong>
                                        <span>Active Books</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon points">
                                        <PersonIcon />
                                    </div>
                                    <div className="stat-content">
                                        <strong>{stats.points}</strong>
                                        <span>Loyalty Points</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <HistoryIcon />
                                    </div>
                                    <div className="stat-content">
                                        <strong>{stats.totalBooks}</strong>
                                        <span>Total Read</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon wishlist">
                                        <FavoriteIcon />
                                    </div>
                                    <div className="stat-content">
                                        <strong>{stats.wishlistCount}</strong>
                                        <span>Wishlist</span>
                                    </div>
                                </div>
                                {stats.pendingFines > 0 && (
                                    <div className="stat-card fine">
                                        <div className="stat-icon">
                                            <WarningIcon />
                                        </div>
                                        <div className="stat-content">
                                            <strong>₹{stats.pendingFines}</strong>
                                            <span>Pending Fines</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button className="edit-profile-btn" onClick={handleEdit}>
                            <EditIcon /> Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="profile-content">
                <div className="container">
                    {/* Tabs Navigation */}
                    <div className="profile-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <PersonIcon /> Overview
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
                            onClick={() => setActiveTab('books')}
                        >
                            <BookIcon /> My Books
                            {stats.activeBooks > 0 && (
                                <span className="tab-badge">{stats.activeBooks}</span>
                            )}
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <HistoryIcon /> History
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wishlist')}
                        >
                            <FavoriteIcon /> Wishlist
                            {stats.wishlistCount > 0 && (
                                <span className="tab-badge">{stats.wishlistCount}</span>
                            )}
                        </button>
                        {stats.pendingFines > 0 && (
                            <button 
                                className={`tab-btn ${activeTab === 'fines' ? 'active' : ''}`}
                                onClick={() => setActiveTab('fines')}
                            >
                                <WarningIcon /> Fines
                                <span className="tab-badge alert">₹{stats.pendingFines}</span>
                            </button>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="overview-tab">
                                <div className="info-section">
                                    <h3><PersonIcon /> Personal Information</h3>
                                    <div className="info-grid">
                                        <div className="info-card">
                                            <EmailIcon className="info-icon" />
                                            <div className="info-content">
                                                <label>Email Address</label>
                                                <p className="info-value">{getSafeValue(profile.email)}</p>
                                            </div>
                                        </div>
                                        <div className="info-card">
                                            <PhoneIcon className="info-icon" />
                                            <div className="info-content">
                                                <label>Mobile Number</label>
                                                <p className="info-value">{getSafeValue(profile.mobileNumber)}</p>
                                            </div>
                                        </div>
                                        <div className="info-card">
                                            <LocationOnIcon className="info-icon" />
                                            <div className="info-content">
                                                <label>Address</label>
                                                <p className="info-value">
                                                    {profile.address?.street && `${profile.address.street}, `}
                                                    {profile.address?.city || ''}
                                                    {profile.address?.state && `, ${profile.address.state}`}
                                                    {profile.address?.pincode && ` - ${profile.address.pincode}`}
                                                    {!profile.address?.street && !profile.address?.city && 'Not provided'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="info-card">
                                            <CalendarTodayIcon className="info-icon" />
                                            <div className="info-content">
                                                <label>Member Since</label>
                                                <p className="info-value">{formatDate(profile.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="activity-section">
                                    <h3><TimerIcon /> Recent Activity</h3>
                                    <div className="activity-list">
                                        {profile.activeTransactions?.length > 0 ? (
                                            profile.activeTransactions.slice(0, 5).map((transaction, index) => (
                                                <div key={transaction._id || index} className="activity-card">
                                                    <BookIcon className="activity-icon" />
                                                    <div className="activity-content">
                                                        <p className="activity-title">
                                                            Currently reading: <strong>{transaction.bookName}</strong>
                                                        </p>
                                                        <div className="activity-meta">
                                                            <span className="activity-date">
                                                                <EventBusyIcon /> Due: {formatDate(transaction.toDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-activity">
                                                <BookIcon style={{ fontSize: 50, color: '#bdc3c7' }} />
                                                <p>No active books</p>
                                                <button 
                                                    className="browse-btn"
                                                    onClick={() => navigate('/books')}
                                                >
                                                    <BookIcon /> Browse Books
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* My Books Tab */}
                        {activeTab === 'books' && (
                            <div className="books-tab">
                                <div className="section-header">
                                    <h3><BookIcon /> Currently Reading ({stats.activeBooks})</h3>
                                    {stats.activeBooks > 0 && (
                                        <button 
                                            className="action-btn primary"
                                            onClick={() => navigate('/books')}
                                        >
                                            <BookIcon /> Borrow More
                                        </button>
                                    )}
                                </div>
                                
                                <div className="books-grid">
                                    {profile.activeTransactions?.length > 0 ? (
                                        profile.activeTransactions.map((transaction, index) => (
                                            <div key={transaction._id || index} className="book-card">
                                                <div className="book-cover">
                                                    {transaction.bookId?.coverImage ? (
                                                        <img 
                                                            src={`${API_URL.replace('/api', '')}${transaction.bookId.coverImage}`}
                                                            alt={transaction.bookName}
                                                        />
                                                    ) : (
                                                        <div className="cover-placeholder">
                                                            <BookIcon />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="book-details">
                                                    <h4>{transaction.bookName}</h4>
                                                    <p className="book-author">
                                                        By {transaction.bookId?.author || 'Unknown Author'}
                                                    </p>
                                                    <div className="book-meta">
                                                        <span className="meta-item">
                                                            <EventAvailableIcon /> Issued: {formatDate(transaction.fromDate)}
                                                        </span>
                                                        <span className="meta-item">
                                                            <EventBusyIcon /> Due: {formatDate(transaction.toDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-books">
                                            <BookIcon style={{ fontSize: 70, color: '#ecf0f1' }} />
                                            <h4>No books currently borrowed</h4>
                                            <button 
                                                className="action-btn primary large"
                                                onClick={() => navigate('/books')}
                                            >
                                                <BookIcon /> Browse Library
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="history-tab">
                                <h3><HistoryIcon /> Reading History ({stats.totalBooks - stats.activeBooks})</h3>
                                <div className="history-list">
                                    {profile.prevTransactions?.length > 0 ? (
                                        profile.prevTransactions.map((transaction, index) => (
                                            <div key={transaction._id || index} className="history-card">
                                                <div className="history-icon">
                                                    {transaction.returnDate ? (
                                                        <CheckCircleIcon className="returned" />
                                                    ) : (
                                                        <WarningIcon className="not-returned" />
                                                    )}
                                                </div>
                                                <div className="history-content">
                                                    <h5>{transaction.bookName}</h5>
                                                    <div className="history-meta">
                                                        <span>
                                                            <EventAvailableIcon /> Borrowed: {formatDate(transaction.fromDate)}
                                                        </span>
                                                        <span>
                                                            {transaction.returnDate ? (
                                                                <><EventBusyIcon /> Returned: {formatDate(transaction.returnDate)}</>
                                                            ) : (
                                                                <><WarningIcon /> Not Returned</>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-history">
                                            <HistoryIcon style={{ fontSize: 70, color: '#ecf0f1' }} />
                                            <h4>No reading history yet</h4>
                                            <p>Your reading history will appear here after you return books</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Wishlist Tab */}
                        {activeTab === 'wishlist' && (
                            <div className="wishlist-tab">
                                <div className="section-header">
                                    <h3><FavoriteIcon /> My Wishlist ({stats.wishlistCount})</h3>
                                    {stats.wishlistCount > 0 && (
                                        <button 
                                            className="action-btn primary"
                                            onClick={() => navigate('/books')}
                                        >
                                            <BookIcon /> Add More
                                        </button>
                                    )}
                                </div>
                                
                                <div className="wishlist-grid">
                                    {profile.wishlist?.length > 0 ? (
                                        profile.wishlist.map((book, index) => (
                                            <div key={book._id || index} className="wishlist-card">
                                                <div className="wishlist-content">
                                                    <h5>{book.bookName}</h5>
                                                    <p className="author">By {book.author}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-wishlist">
                                            <FavoriteIcon style={{ fontSize: 70, color: '#ecf0f1' }} />
                                            <h4>Your wishlist is empty</h4>
                                            <button 
                                                className="action-btn primary large"
                                                onClick={() => navigate('/books')}
                                            >
                                                <BookIcon /> Discover Books
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Fines Tab */}
                        {activeTab === 'fines' && stats.pendingFines > 0 && (
                            <div className="fines-tab">
                                <div className="fines-summary">
                                    <h3><WarningIcon /> Pending Fines</h3>
                                    <div className="fines-stats">
                                        <div className="fine-stat-card">
                                            <div className="fine-value">₹{stats.pendingFines}</div>
                                            <div className="fine-label">Total Pending</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ensure this is exported as a named export
export { Profile };

// Also export as default for lazy loading compatibility
export default Profile;