import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FileDownloadIcon from '@mui/icons-material/GetApp';
import EmailIcon from '@mui/icons-material/Email';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({});
    const [finesData, setFinesData] = useState({ 
        transactions: [], 
        totalDue: 0, 
        totalPaid: 0, 
        total: 0 
    });
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [finesLoading, setFinesLoading] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    useEffect(() => {
        if (user && (user.isAdmin || user.isLibrarian)) {
            fetchDashboardData();
            if (activeSection === 'fines') {
                fetchFinesData();
            }
        } else {
            navigate('/signin');
        }
    }, [user, navigate, activeSection]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get(`${API_URL}/dashboard/stats`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                setDashboardData(response.data.data);
            } else {
                setDashboardData({
                    totalBooks: 0,
                    totalUsers: 0,
                    activeTransactions: 0,
                    overdueBooks: 0,
                    totalDueFines: 0,
                    totalFinesPaid: 0,
                    totalEvents: 0,
                    newUsersThisMonth: 0,
                    availableBooks: 0
                });
            }
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            setDashboardData({
                totalBooks: 0,
                totalUsers: 0,
                activeTransactions: 0,
                overdueBooks: 0,
                totalDueFines: 0,
                totalFinesPaid: 0,
                totalEvents: 0,
                newUsersThisMonth: 0,
                availableBooks: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchFinesData = async () => {
        try {
            setFinesLoading(true);
            const token = localStorage.getItem('token');
            
            // Try to get overdue transactions
            const response = await axios.get(`${API_URL}/transactions/overdue`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                const transactions = response.data.data || [];
                const totalDue = transactions.reduce((sum, t) => sum + (t.fineAmount || 0), 0);
                
                setFinesData({
                    transactions: transactions,
                    totalDue: totalDue,
                    totalPaid: dashboardData.totalFinesPaid || 0,
                    total: transactions.length
                });
            }
        } catch (error) {
            console.error('❌ Error fetching fines data:', error);
            // Use dashboard data as fallback
            setFinesData({
                transactions: [],
                totalDue: dashboardData.totalDueFines || 0,
                totalPaid: dashboardData.totalFinesPaid || 0,
                total: dashboardData.overdueBooks || 0
            });
        } finally {
            setFinesLoading(false);
        }
    };

    const handleCalculateFines = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/transactions/check-overdue`, {}, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                alert('Fines calculated successfully!');
                fetchDashboardData();
                fetchFinesData();
            }
        } catch (error) {
            alert('Error calculating fines: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleSendFineReminders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/notifications/fine-reminders`, {}, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            alert(response.data.message || 'Fine reminders sent successfully!');
        } catch (error) {
            alert('Error sending reminders: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleGenerateReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/fines`, {
                headers: { 
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fines-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Report generation error:', error);
            alert('Report generation is not yet implemented. Please check back later.');
        }
    };

    const handleExportFinesReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/export-fines`, {
                headers: { 
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fines-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            // Fallback: Generate CSV from local data
            exportCSVFromData();
        }
    };

    const exportCSVFromData = () => {
        const headers = ['User Name', 'Book Title', 'Due Date', 'Fine Amount', 'Status', 'Days Overdue'];
        const csvData = [
            headers,
            ...finesData.transactions.map(transaction => {
                const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(transaction.toDate)) / (1000 * 60 * 60 * 24)));
                return [
                    transaction.borrowerName || 'Unknown',
                    transaction.bookName || 'Unknown',
                    new Date(transaction.toDate).toLocaleDateString(),
                    `₹${transaction.fineAmount || 0}`,
                    transaction.transactionStatus || 'Pending',
                    daysOverdue
                ];
            })
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `fines-export-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleAddUser = () => {
        navigate('/admin/add-user');
    };

    const handleManageUsers = () => {
        navigate('/admin/users');
    };

    const handleExportUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/export-users`, {
                headers: { 
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export users error:', error);
            alert('Export users functionality coming soon!');
        }
    };

    const handleAddBook = () => {
        navigate('/admin/add-book');
    };

    const handleManageBooks = () => {
        navigate('/admin/books');
    };

    const handleImportBooks = () => {
        alert('Book import functionality will be available soon!');
    };

    const handleCreateEvent = () => {
        navigate('/admin/create-event');
    };

    const handleViewCalendar = () => {
        navigate('/admin/calendar');
    };

    const handlePayFine = async (transactionId) => {
        if (!window.confirm('Are you sure you want to mark this fine as paid?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/transactions/${transactionId}/pay-fine`, {}, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                alert('Fine marked as paid successfully!');
                fetchFinesData();
                fetchDashboardData();
            }
        } catch (error) {
            alert('Error processing payment: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div className="container">
                    <h1>Admin Dashboard</h1>
                    <p>Manage Vadodara Central Library operations</p>
                    <div className="admin-welcome">
                        <p>Welcome back, <strong>{user?.userFullName || 'Admin'}</strong>! ({user?.isAdmin ? 'Administrator' : 'Librarian'})</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="container">
                    <div className="dashboard-layout">
                        <div className="sidebar">
                            <div className="sidebar-menu">
                                <button 
                                    className={activeSection === 'overview' ? 'active' : ''}
                                    onClick={() => setActiveSection('overview')}
                                    title="Dashboard Overview"
                                >
                                    <DashboardIcon /> <span>Overview</span>
                                </button>
                                <button 
                                    className={activeSection === 'fines' ? 'active' : ''}
                                    onClick={() => setActiveSection('fines')}
                                    title="Manage Fines"
                                >
                                    <AttachMoneyIcon /> <span>Fines Management</span>
                                </button>
                                <button 
                                    className={activeSection === 'users' ? 'active' : ''}
                                    onClick={() => setActiveSection('users')}
                                    title="Manage Users"
                                >
                                    <PeopleIcon /> <span>Users</span>
                                </button>
                                <button 
                                    className={activeSection === 'books' ? 'active' : ''}
                                    onClick={() => setActiveSection('books')}
                                    title="Manage Books"
                                >
                                    <BookIcon /> <span>Books</span>
                                </button>
                                <button 
                                    className={activeSection === 'events' ? 'active' : ''}
                                    onClick={() => setActiveSection('events')}
                                    title="Manage Events"
                                >
                                    <EventIcon /> <span>Events</span>
                                </button>
                            </div>
                        </div>

                        <div className="main-content">
                            {activeSection === 'overview' && (
                                <div className="overview-section">
                                    <div className="stats-cards">
                                        <div className="stat-card large primary">
                                            <div className="stat-content">
                                                <h3>{dashboardData.totalBooks?.toLocaleString() || '0'}</h3>
                                                <p>Total Books</p>
                                            </div>
                                            <LibraryBooksIcon className="stat-icon" />
                                        </div>
                                        <div className="stat-card secondary">
                                            <div className="stat-content">
                                                <h3>{dashboardData.totalUsers?.toLocaleString() || '0'}</h3>
                                                <p>Registered Users</p>
                                            </div>
                                            <PeopleIcon className="stat-icon" />
                                        </div>
                                        <div className="stat-card info">
                                            <div className="stat-content">
                                                <h3>{dashboardData.activeTransactions?.toLocaleString() || '0'}</h3>
                                                <p>Active Issues</p>
                                            </div>
                                            <TrendingUpIcon className="stat-icon" />
                                        </div>
                                        <div className="stat-card warning">
                                            <div className="stat-content">
                                                <h3>{dashboardData.overdueBooks?.toLocaleString() || '0'}</h3>
                                                <p>Overdue Books</p>
                                            </div>
                                            <WarningIcon className="stat-icon" />
                                        </div>
                                        <div className="stat-card danger">
                                            <div className="stat-content">
                                                <h3>₹{(dashboardData.totalDueFines || 0).toLocaleString()}</h3>
                                                <p>Due Fines</p>
                                            </div>
                                            <AttachMoneyIcon className="stat-icon" />
                                        </div>
                                        <div className="stat-card success">
                                            <div className="stat-content">
                                                <h3>₹{(dashboardData.totalFinesPaid || 0).toLocaleString()}</h3>
                                                <p>Fines Collected</p>
                                            </div>
                                            <PaymentIcon className="stat-icon" />
                                        </div>
                                    </div>

                                    <div className="admin-actions">
                                        <h3>Quick Actions</h3>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-action primary"
                                                onClick={handleAddUser}
                                                title="Add new library user"
                                            >
                                                <PersonAddIcon /> Add New User
                                            </button>
                                            <button 
                                                className="btn-action secondary"
                                                onClick={handleAddBook}
                                                title="Add new book to catalog"
                                            >
                                                <AddBoxIcon /> Add New Book
                                            </button>
                                            <button 
                                                className="btn-action info"
                                                onClick={handleCreateEvent}
                                                title="Create new library event"
                                            >
                                                <CalendarTodayIcon /> Create Event
                                            </button>
                                            <button 
                                                className="btn-action warning"
                                                onClick={handleCalculateFines}
                                                title="Calculate overdue fines"
                                            >
                                                <AttachMoneyIcon /> Calculate Fines
                                            </button>
                                        </div>
                                    </div>

                                    {dashboardData.overdueBooks > 0 && (
                                        <div className="recent-fines">
                                            <h3>Recent Overdue Books</h3>
                                            <div className="fines-list">
                                                {finesData.transactions.slice(0, 5).map(transaction => {
                                                    const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(transaction.toDate)) / (1000 * 60 * 60 * 24)));
                                                    
                                                    return (
                                                        <div key={transaction._id} className="fine-item">
                                                            <div className="fine-info">
                                                                <p>
                                                                    <strong>{transaction.borrowerName || 'Unknown User'}</strong> - 
                                                                    {transaction.bookName || 'Unknown Book'}
                                                                </p>
                                                                <small>
                                                                    Due: {new Date(transaction.toDate).toLocaleDateString()} | 
                                                                    Fine: ₹{transaction.fineAmount || 0} | 
                                                                    Days Overdue: {daysOverdue}
                                                                </small>
                                                            </div>
                                                            <div className="fine-actions">
                                                                <span className={`status ${transaction.transactionStatus?.toLowerCase() || 'pending'}`}>
                                                                    {transaction.transactionStatus || 'Pending'}
                                                                </span>
                                                                {transaction.transactionStatus === 'Active' && (
                                                                    <button 
                                                                        className="btn-small"
                                                                        onClick={() => handlePayFine(transaction._id)}
                                                                        disabled={finesLoading}
                                                                    >
                                                                        {finesLoading ? 'Processing...' : 'Mark Paid'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {finesData.transactions.length === 0 && (
                                                    <p className="no-data">No pending fines found</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'fines' && (
                                <div className="fines-management-section">
                                    <div className="section-header">
                                        <h2>Fines Management</h2>
                                        <div className="section-actions">
                                            <button 
                                                className="btn-primary" 
                                                onClick={handleCalculateFines}
                                                disabled={finesLoading}
                                            >
                                                {finesLoading ? 'Calculating...' : 'Calculate Overdue Fines'}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={handleSendFineReminders}
                                                disabled={finesLoading}
                                            >
                                                <EmailIcon /> Send Fine Reminders
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={handleGenerateReport}
                                            >
                                                <FileDownloadIcon /> Generate Report
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={handleExportFinesReport}
                                            >
                                                <FileDownloadIcon /> Export CSV
                                            </button>
                                        </div>
                                    </div>

                                    <div className="fines-summary-cards">
                                        <div className="summary-card">
                                            <h3>Total Due Fines</h3>
                                            <div className="amount">₹{finesData.totalDue.toLocaleString()}</div>
                                            <p>Across {finesData.total} transactions</p>
                                        </div>
                                        <div className="summary-card paid">
                                            <h3>Total Collected</h3>
                                            <div className="amount">₹{finesData.totalPaid.toLocaleString()}</div>
                                            <p>All time fines collection</p>
                                        </div>
                                    </div>

                                    <div className="fines-table">
                                        <h3>Pending Fines</h3>
                                        {finesLoading ? (
                                            <div className="loading">Loading fines data...</div>
                                        ) : (
                                            <div className="table-container">
                                                {finesData.transactions.length > 0 ? (
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>User</th>
                                                                <th>Book</th>
                                                                <th>Due Date</th>
                                                                <th>Fine Amount</th>
                                                                <th>Status</th>
                                                                <th>Days Overdue</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {finesData.transactions.map(transaction => {
                                                                const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(transaction.toDate)) / (1000 * 60 * 60 * 24)));
                                                                
                                                                return (
                                                                    <tr key={transaction._id}>
                                                                        <td>
                                                                            <div className="user-info">
                                                                                <strong>{transaction.borrowerName || 'Unknown'}</strong>
                                                                                <small>{transaction.borrowerId?.admissionId || transaction.borrowerId?.employeeId || 'N/A'}</small>
                                                                            </div>
                                                                        </td>
                                                                        <td>{transaction.bookName || 'Unknown'}</td>
                                                                        <td>{new Date(transaction.toDate).toLocaleDateString()}</td>
                                                                        <td className="fine-amount">₹{transaction.fineAmount || 0}</td>
                                                                        <td>
                                                                            <span className={`status ${transaction.transactionStatus?.toLowerCase() || 'pending'}`}>
                                                                                {transaction.transactionStatus || 'Pending'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`days-overdue ${daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low'}`}>
                                                                                {daysOverdue}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            {transaction.transactionStatus === 'Active' && (
                                                                                <button 
                                                                                    className="btn-small"
                                                                                    onClick={() => handlePayFine(transaction._id)}
                                                                                    disabled={finesLoading}
                                                                                >
                                                                                    Mark Paid
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="no-data">
                                                        <PaymentIcon style={{ fontSize: 48 }} />
                                                        <p>No pending fines found</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeSection === 'users' && (
                                <div className="users-section">
                                    <h2>User Management</h2>
                                    <div className="section-actions">
                                        <button 
                                            className="btn-primary"
                                            onClick={handleAddUser}
                                        >
                                            <PersonAddIcon /> Add New User
                                        </button>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleExportUsers}
                                        >
                                            <FileDownloadIcon /> Export Users
                                        </button>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleManageUsers}
                                        >
                                            <PeopleIcon /> View All Users
                                        </button>
                                    </div>
                                    <div className="info-box">
                                        <h4>Manage Library Users</h4>
                                        <p>
                                            Add new library members, update user profiles, manage user permissions, 
                                            and track user borrowing history. You can also export user data for reporting.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'books' && (
                                <div className="books-section">
                                    <h2>Book Management</h2>
                                    <div className="section-actions">
                                        <button 
                                            className="btn-primary"
                                            onClick={handleAddBook}
                                        >
                                            <AddBoxIcon /> Add New Book
                                        </button>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleImportBooks}
                                        >
                                            <FileDownloadIcon /> Import Books
                                        </button>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleManageBooks}
                                        >
                                            <BookIcon /> View All Books
                                        </button>
                                    </div>
                                    <div className="info-box">
                                        <h4>Manage Library Collection</h4>
                                        <p>
                                            Add new books to the library catalog, update book information, 
                                            manage book copies, track book availability, and import books in bulk.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'events' && (
                                <div className="events-section">
                                    <h2>Event Management</h2>
                                    <div className="section-actions">
                                        <button 
                                            className="btn-primary"
                                            onClick={handleCreateEvent}
                                        >
                                            <CalendarTodayIcon /> Create Event
                                        </button>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleViewCalendar}
                                        >
                                            <EventIcon /> View Calendar
                                        </button>
                                    </div>
                                    <div className="info-box">
                                        <h4>Manage Library Events</h4>
                                        <p>
                                            Create and manage library events, workshops, book clubs, and other activities. 
                                            Track event registrations, manage attendance, and promote library programs.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;