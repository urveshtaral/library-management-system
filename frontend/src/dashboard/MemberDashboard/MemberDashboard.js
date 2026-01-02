
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './MemberDashboard.css';

import BookIcon from '@mui/icons-material/Book';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

function MemberDashboard() {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({
    activeBooks: [],
    readingHistory: [],
    wishlist: [],
    fines: { 
      dueTransactions: [], 
      totalDue: 0, 
      dueCount: 0, 
      paidTransactions: [], 
      totalPaid: 0 
    },
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  
  const isMounted = useRef(true);
  const abortControllers = useRef([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    isMounted.current = false;
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Calculate days overdue
  const calculateDaysOverdue = useCallback((dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays < 0 ? Math.abs(diffDays) : 0;
  }, []);

  // Calculate days until due
  const calculateDaysUntilDue = useCallback((dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Get due status
  const getDueStatus = useCallback((dueDate) => {
    if (!dueDate) return 'normal';
    const daysUntilDue = calculateDaysUntilDue(dueDate);
    const daysOverdue = calculateDaysOverdue(dueDate);
    
    if (daysOverdue > 0) return 'overdue';
    if (daysUntilDue <= 3) return 'due-soon';
    return 'normal';
  }, [calculateDaysUntilDue, calculateDaysOverdue]);

  // Calculate fine amount
  const calculateFineAmount = useCallback((dueDate, fineRate = 5) => {
    const daysOverdue = calculateDaysOverdue(dueDate);
    return daysOverdue * fineRate;
  }, [calculateDaysOverdue]);

  // Main data fetching effect
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        if (!isMounted.current) return;
        setLoading(true);
        
        const token = localStorage.getItem('token');
        const userId = user?.id || user?._id;
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        
        if (!userId || !token) {
          throw new Error('User authentication required');
        }

        // Create abort controller
        const controller = new AbortController();
        abortControllers.current.push(controller);

        // Fetch all data
        const [profileResponse, finesResponse] = await Promise.allSettled([
          axios.get(`${API_URL}/users/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }),
          axios.get(`${API_URL}/fines/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          })
        ]);

        if (!isMounted.current) return;

        // Process profile data
        if (profileResponse.status === 'fulfilled' && profileResponse.value.data.success) {
          const profileData = profileResponse.value.data.data;
          setUserProfile(profileData);
          
          setDashboardData(prev => ({
            ...prev,
            activeBooks: profileData.activeTransactions || [],
            readingHistory: profileData.prevTransactions || [],
            wishlist: profileData.wishlist || [],
            stats: {
              activeBooks: profileData.activeTransactions?.length || 0,
              totalBooksRead: profileData.prevTransactions?.length || 0,
              wishlistCount: profileData.wishlist?.length || 0,
              points: user?.points || 0
            }
          }));
        }

        // Process fines data
        if (finesResponse.status === 'fulfilled' && finesResponse.value.data.success) {
          setDashboardData(prev => ({
            ...prev,
            fines: finesResponse.value.data.data
          }));
        }

        // Handle rejections
        if (profileResponse.status === 'rejected' && profileResponse.reason.name !== 'AbortError') {
          console.error('Profile fetch failed:', profileResponse.reason);
        }
        
        if (finesResponse.status === 'rejected' && finesResponse.reason.name !== 'AbortError') {
          console.error('Fines fetch failed:', finesResponse.reason);
          setDashboardData(prev => ({
            ...prev,
            fines: {
              dueTransactions: [],
              totalDue: 0,
              dueCount: 0,
              paidTransactions: [],
              totalPaid: 0
            }
          }));
        }

      } catch (error) {
        if (error.name !== 'AbortError' && isMounted.current) {
          console.error('Error fetching dashboard data:', error);
          
          // Fallback data
          setDashboardData({
            activeBooks: [],
            readingHistory: [],
            wishlist: [],
            fines: {
              dueTransactions: [],
              totalDue: 0,
              dueCount: 0,
              paidTransactions: [],
              totalPaid: 0
            },
            stats: {
              activeBooks: 0,
              totalBooksRead: 0,
              wishlistCount: 0,
              points: user?.points || 0,
              overdueBooks: 0,
              pendingFines: 0
            }
          });
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current = [];
    };
  }, [user]);

  // Action handlers
  const handlePayFine = useCallback(async (transactionId, amount) => {
    if (!isMounted.current) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/fines/pay`, {
        transactionId,
        amount,
        paymentMethod: 'online'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && isMounted.current) {
        alert('Fine paid successfully!');
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('❌ Error paying fine:', error);
        alert(error.response?.data?.message || 'Error processing payment');
      }
    }
  }, []);

  const handleRenewBook = useCallback(async (transactionId) => {
    if (!isMounted.current) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/transactions/renew`, {
        transactionId,
        additionalDays: 7
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && isMounted.current) {
        alert('Book renewed successfully!');
        window.location.reload();
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('❌ Error renewing book:', error);
        alert(error.response?.data?.message || 'Error renewing book');
      }
    }
  }, []);

  const handleBrowseBooks = useCallback(() => {
    window.location.href = '/books';
  }, []);

  if (loading) {
    return (
      <div className="member-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading your dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.userFullName}!</h1>
          <p>Here's what's happening with your library account</p>
          
          {/* User Info Card */}
          <div className="user-info-card">
            <div className="user-avatar">
              {user?.photo ? (
                <img src={`http://localhost:4000${user.photo}`} alt={user?.userFullName} />
              ) : (
                <PersonIcon style={{ fontSize: 40 }} />
              )}
            </div>
            <div className="user-details">
              <h3>{user?.userFullName}</h3>
              <div className="user-meta">
                <span className="user-type">{user?.userType}</span>
                {user?.admissionId && <span className="user-id">ID: {user.admissionId}</span>}
                {user?.employeeId && <span className="user-id">ID: {user.employeeId}</span>}
              </div>
              <div className="contact-info">
                {user?.email && (
                  <span><EmailIcon /> {user.email}</span>
                )}
                {user?.mobileNumber && (
                  <span><PhoneIcon /> {user.mobileNumber}</span>
                )}
              </div>
              {user?.department && (
                <div className="department-info">
                  <SchoolIcon />
                  <span>{user.department}</span>
                  {user?.course && <span> • {user.course}</span>}
                  {user?.semester && <span> • Semester {user.semester}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Fines Alert */}
        {dashboardData.fines.totalDue > 0 && (
          <div className="fines-alert">
            <WarningIcon className="alert-icon" />
            <div className="alert-content">
              <h3>Outstanding Fines: ₹{dashboardData.fines.totalDue}</h3>
              <p>You have {dashboardData.fines.dueCount} item(s) with pending fines</p>
            </div>
            <button 
              className="pay-now-btn"
              onClick={() => setActiveTab('fines')}
            >
              Pay Now
            </button>
          </div>
        )}

        <div className="user-stats">
          <div className="stat-card">
            <BookIcon className="stat-icon" />
            <div className="stat-content">
              <h3>{dashboardData.activeBooks.length}</h3>
              <p>Active Books</p>
              {dashboardData.activeBooks.length > 0 && (
                <small>
                  {dashboardData.activeBooks.filter(book => 
                    getDueStatus(book.toDate) === 'due-soon'
                  ).length} due soon
                </small>
              )}
            </div>
          </div>
          
          <div className="stat-card">
            <HistoryIcon className="stat-icon" />
            <div className="stat-content">
              <h3>{dashboardData.readingHistory.length}</h3>
              <p>Books Read</p>
              <small>Total reading history</small>
            </div>
          </div>
          
          <div className="stat-card">
            <FavoriteIcon className="stat-icon" />
            <div className="stat-content">
              <h3>{dashboardData.wishlist.length}</h3>
              <p>Wishlist</p>
              <small>Books to read</small>
            </div>
          </div>
          
          <div className="stat-card">
            <TrendingUpIcon className="stat-icon" />
            <div className="stat-content">
              <h3>{user?.points || 0}</h3>
              <p>Loyalty Points</p>
              <small>Earn rewards</small>
            </div>
          </div>
          
          <div className={`stat-card ${dashboardData.fines.totalDue > 0 ? 'fine-warning' : 'fine-clear'}`}>
            <PaymentIcon className="stat-icon" />
            <div className="stat-content">
              <h3>₹{dashboardData.fines.totalDue}</h3>
              <p>Due Fines</p>
              <small>{dashboardData.fines.dueCount} pending</small>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <BookIcon /> Overview
        </button>
        <button 
          className={activeTab === 'books' ? 'active' : ''}
          onClick={() => setActiveTab('books')}
        >
          <HistoryIcon /> My Books
        </button>
        <button 
          className={activeTab === 'fines' ? 'active' : ''}
          onClick={() => setActiveTab('fines')}
        >
          <PaymentIcon /> Fines & Payments
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="dashboard-section active-books">
              <h2>📚 Currently Reading ({dashboardData.activeBooks.length})</h2>
              <div className="books-grid">
                {dashboardData.activeBooks.length > 0 ? (
                  dashboardData.activeBooks.map((transaction, index) => {
                    const dueStatus = getDueStatus(transaction.toDate);
                    const daysUntilDue = calculateDaysUntilDue(transaction.toDate);
                    const daysOverdue = calculateDaysOverdue(transaction.toDate);
                    const calculatedFine = calculateFineAmount(transaction.toDate);
                    
                    return (
                      <div key={transaction._id || index} className={`book-item ${dueStatus}`}>
                        <div className="book-cover">
                          {transaction.bookId?.coverImage ? (
                            <img 
                              src={`http://localhost:4000${transaction.bookId.coverImage}`} 
                              alt={transaction.bookName}
                            />
                          ) : (
                            <BookIcon style={{ fontSize: 40, color: '#666' }} />
                          )}
                        </div>
                        <div className="book-info">
                          <h4>{transaction.bookName || 'Book Title'}</h4>
                          {transaction.toDate && (
                            <p className="due-date">
                              <CalendarTodayIcon style={{ fontSize: 14, marginRight: 4 }} />
                              Due: {new Date(transaction.toDate).toLocaleDateString()}
                            </p>
                          )}
                          <div className="due-status">
                            <span className={`status-badge ${dueStatus}`}>
                              {dueStatus === 'overdue' ? `Overdue by ${daysOverdue} days` :
                               dueStatus === 'due-soon' ? `Due in ${daysUntilDue} days` :
                               `Due in ${daysUntilDue} days`}
                            </span>
                          </div>
                          {daysOverdue > 0 && (
                            <span className="fine-badge">Fine: ₹{calculatedFine}</span>
                          )}
                          <button 
                            className="renew-btn"
                            onClick={() => handleRenewBook(transaction._id)}
                            disabled={transaction.renewalCount >= 2}
                          >
                            {transaction.renewalCount >= 2 ? 'Max Renewals' : 'Renew Book'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-data">
                    <BookIcon style={{ fontSize: 48, color: '#ccc' }} />
                    <p>No active books</p>
                    <small>Visit the library to borrow books</small>
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-section quick-actions">
              <h2>🚀 Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={handleBrowseBooks}>
                  <BookIcon />
                  <span>Browse Books</span>
                </button>
                {dashboardData.fines.totalDue > 0 && (
                  <button 
                    className="action-btn warning"
                    onClick={() => setActiveTab('fines')}
                  >
                    <PaymentIcon />
                    <span>Pay Fines</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="books-section">
            <h2>📚 My Books</h2>
            <div className="books-list">
              {dashboardData.activeBooks.length > 0 ? (
                dashboardData.activeBooks.map((transaction, index) => {
                  const dueStatus = getDueStatus(transaction.toDate);
                  const daysUntilDue = calculateDaysUntilDue(transaction.toDate);
                  const daysOverdue = calculateDaysOverdue(transaction.toDate);
                  const calculatedFine = calculateFineAmount(transaction.toDate);
                  
                  return (
                    <div key={transaction._id || index} className="book-detail-item">
                      <div className="book-cover-large">
                        {transaction.bookId?.coverImage ? (
                          <img 
                            src={`http://localhost:4000${transaction.bookId.coverImage}`} 
                            alt={transaction.bookName}
                          />
                        ) : (
                          <BookIcon style={{ fontSize: 60, color: '#666' }} />
                        )}
                      </div>
                      <div className="book-details">
                        <h3>{transaction.bookName || 'Book Title'}</h3>
                        <p className="book-author">
                          By {transaction.bookId?.author || 'Unknown Author'}
                        </p>
                        {transaction.fromDate && (
                          <div className="book-meta">
                            <span>Issued: {new Date(transaction.fromDate).toLocaleDateString()}</span>
                            {transaction.toDate && (
                              <span>Due: {new Date(transaction.toDate).toLocaleDateString()}</span>
                            )}
                            {transaction.renewalCount > 0 && (
                              <span>Renewed: {transaction.renewalCount} times</span>
                            )}
                          </div>
                        )}
                        <div className="book-actions">
                          <button 
                            className="renew-btn"
                            onClick={() => handleRenewBook(transaction._id)}
                            disabled={transaction.renewalCount >= 2}
                          >
                            {transaction.renewalCount >= 2 ? 'Max Renewals Reached' : 'Renew for 7 Days'}
                          </button>
                          {calculatedFine > 0 && (
                            <button 
                              className="pay-fine-btn-small"
                              onClick={() => setActiveTab('fines')}
                            >
                              Pay Fine: ₹{calculatedFine}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="due-status-indicator">
                        <span className={`status-dot ${dueStatus}`}></span>
                        <span className="status-text">
                          {dueStatus === 'overdue' ? `Overdue by ${daysOverdue} days` :
                           dueStatus === 'due-soon' ? `Due in ${daysUntilDue} days` :
                           'On track'}
                        </span>
                        {daysOverdue > 0 && (
                          <span className="overdue-fine">Fine: ₹{calculatedFine}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-books">
                  <BookIcon style={{ fontSize: 60, color: '#ccc' }} />
                  <h3>No Active Books</h3>
                  <p>You don't have any books checked out at the moment.</p>
                  <button className="browse-books-btn" onClick={handleBrowseBooks}>
                    Browse Books
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'fines' && (
          <div className="fines-section">
            <h2>💰 Fines & Payments</h2>
            
            {dashboardData.fines.totalDue > 0 ? (
              <>
                <div className="fines-summary">
                  <div className="summary-card warning">
                    <h3>Outstanding Balance: ₹{dashboardData.fines.totalDue}</h3>
                    <p>{dashboardData.fines.dueCount} item(s) require payment</p>
                    <small>Please pay your fines to continue borrowing books</small>
                  </div>
                </div>

                <div className="fines-list">
                  <h3>📋 Pending Fines</h3>
                  {dashboardData.fines.dueTransactions.map((transaction, index) => {
                    const daysOverdue = calculateDaysOverdue(transaction.toDate);
                    const calculatedFine = calculateFineAmount(transaction.toDate);
                    
                    return (
                      <div key={transaction._id || index} className="fine-item">
                        <div className="fine-info">
                          <div className="book-cover-small">
                            {transaction.bookId?.coverImage ? (
                              <img 
                                src={`http://localhost:4000${transaction.bookId.coverImage}`} 
                                alt={transaction.bookName}
                              />
                            ) : (
                              <BookIcon />
                            )}
                          </div>
                          <div className="fine-details">
                            <h4>{transaction.bookId?.bookName || transaction.bookName}</h4>
                            <p>Due Date: {new Date(transaction.toDate).toLocaleDateString()}</p>
                            <p>Days Overdue: {daysOverdue}</p>
                            <div className="fine-amount">
                              <strong>Fine Amount: ₹{calculatedFine}</strong>
                            </div>
                          </div>
                        </div>
                        <button 
                          className="pay-fine-btn"
                          onClick={() => handlePayFine(transaction._id, calculatedFine)}
                        >
                          <PaymentIcon />
                          Pay ₹{calculatedFine}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="no-fines">
                <PaymentIcon style={{ fontSize: 60, color: '#4CAF50' }} />
                <h3>No Pending Fines</h3>
                <p>You're all caught up with your payments! 🎉</p>
                <small>Keep up the good work with timely returns</small>
              </div>
            )}

            {dashboardData.fines.paidTransactions.length > 0 && (
              <div className="payment-history">
                <h3>📊 Payment History</h3>
                <div className="paid-list">
                  {dashboardData.fines.paidTransactions.map((transaction, index) => (
                    <div key={transaction._id || index} className="paid-item">
                      <div className="paid-info">
                        <div className="book-cover-small">
                          {transaction.bookId?.coverImage ? (
                            <img 
                              src={`http://localhost:4000${transaction.bookId.coverImage}`} 
                              alt={transaction.bookName}
                            />
                          ) : (
                            <BookIcon />
                          )}
                        </div>
                        <div className="paid-details">
                          <h4>{transaction.bookId?.bookName || transaction.bookName}</h4>
                          <p>Amount Paid: ₹{transaction.fineAmount}</p>
                          <small>Paid on: {new Date(transaction.returnDate || transaction.paymentDate).toLocaleDateString()}</small>
                        </div>
                      </div>
                      <span className="status-badge paid">Paid</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberDashboard;