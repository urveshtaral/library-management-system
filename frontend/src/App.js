// src/App.js - UPDATED WITH ADMIN LOGIN ROUTE
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useLocation 
} from "react-router-dom";
import { AuthContextProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { io } from 'socket.io-client';

// Code Splitting: Group routes by category
const PublicRoutes = lazy(() => import('./routes/PublicRoutes'));
const MemberRoutes = lazy(() => import('./routes/MemberRoutes'));
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLogin = lazy(() => import('./components/AdminLogin')); // Added AdminLogin

// Socket Context
const SocketContext = React.createContext();

// Custom hook to use socket
export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

// Error Boundary Component (for crash protection)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to error tracking service
    if (window.errorLogService) {
      window.errorLogService.logError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button 
            onClick={() => window.location.reload()}
            className="refresh-btn"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="retry-btn"
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="error-details">
              <summary>Error Details</summary>
              <p>{this.state.error?.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Socket Provider Component with error handling
const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const { user, token } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  useEffect(() => {
    let isMounted = true;
    let socketInstance = null;

    const initializeSocket = async () => {
      try {
        // Only create socket if we have a user and token
        if (user && token) {
          console.log('🔌 Initializing socket connection...');
          
          socketInstance = io(API_URL, {
            transports: ['websocket', 'polling'],
            auth: {
              token: token
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
          });

          if (isMounted) {
            setSocket(socketInstance);
          }

          // Connection events with error handling
          socketInstance.on('connect', () => {
            console.log('✅ Socket connected:', socketInstance.id);
            setConnectionStatus('connected');
            setError(null);
            
            // Join user-specific room
            socketInstance.emit('join-user-room', user._id);
            
            toast.info('Real-time updates enabled', {
              position: "top-right",
              autoClose: 2000,
              hideProgressBar: true
            });
          });

          socketInstance.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setConnectionStatus('error');
            setError(error.message);
            
            toast.error('Connection error. Some features may be limited.', {
              position: "top-right",
              autoClose: 3000
            });
          });

          socketInstance.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            setConnectionStatus('disconnected');
            
            if (reason === 'io server disconnect') {
              // Server forced disconnect, try to reconnect
              setTimeout(() => {
                if (socketInstance && !socketInstance.connected) {
                  socketInstance.connect();
                }
              }, 1000);
            }
          });

          socketInstance.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
            setConnectionStatus('connected');
            setError(null);
          });

          socketInstance.on('reconnect_error', (error) => {
            console.error('❌ Socket reconnection error:', error);
            setError(error.message);
          });

          // Real-time notifications with safe handling
          const setupNotificationHandlers = () => {
            const handlers = {
              bookBorrowed: (data) => {
                if (data.userId === user._id) {
                  toast.success(`Book borrowed: ${data.bookName}`, {
                    position: "top-right",
                    autoClose: 3000
                  });
                }
              },
              bookReturned: (data) => {
                if (data.userId === user._id) {
                  toast.info(`Book returned: ${data.bookName}`, {
                    position: "top-right",
                    autoClose: 3000
                  });
                }
              },
              newBookAdded: (book) => {
                toast.info(`New book available: ${book.bookName}`, {
                  position: "top-right",
                  autoClose: 3000
                });
              },
              newEventAdded: (event) => {
                toast.info(`New event: ${event.title}`, {
                  position: "top-right",
                  autoClose: 3000,
                  onClick: () => window.location.href = '/events'
                });
              },
              overdueNotification: (notification) => {
                if (notification.userId === user._id) {
                  toast.warning(`Overdue: ${notification.bookName}`, {
                    position: "top-right",
                    autoClose: 5000
                  });
                }
              },
              systemMessage: (message) => {
                toast.info(message.text, {
                  position: "top-right",
                  autoClose: 4000
                });
              }
            };

            // Admin-only handlers
            if (user.isAdmin || user.isLibrarian) {
              handlers.newRegistration = (newUser) => {
                toast.info(`New user: ${newUser.userFullName}`, {
                  position: "top-right",
                  autoClose: 3000
                });
              };
              handlers.finePayment = (payment) => {
                toast.success(`Fine paid: ₹${payment.amount}`, {
                  position: "top-right",
                  autoClose: 3000
                });
              };
            }

            // Attach handlers
            Object.entries(handlers).forEach(([event, handler]) => {
              socketInstance.on(event, handler);
            });

            return () => {
              Object.keys(handlers).forEach(event => {
                socketInstance.off(event);
              });
            };
          };

          const cleanupHandlers = setupNotificationHandlers();
        }
      } catch (err) {
        console.error('Failed to initialize socket:', err);
        setError(err.message);
        
        if (isMounted) {
          toast.error('Failed to establish real-time connection', {
            position: "top-right",
            autoClose: 3000
          });
        }
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (socketInstance) {
        console.log('🧹 Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, [user, token, API_URL]);

  // Safe emit function
  const emitEvent = (event, data) => {
    try {
      if (socket && socket.connected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit:', event);
        toast.warning('Connection lost. Please refresh the page.', {
          position: "top-right",
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Error emitting socket event:', err);
    }
  };

  // Join room function
  const joinRoom = (roomName) => {
    try {
      if (socket && socket.connected) {
        socket.emit('join-room', roomName);
      }
    } catch (err) {
      console.error('Error joining room:', err);
    }
  };

  // Leave room function
  const leaveRoom = (roomName) => {
    try {
      if (socket && socket.connected) {
        socket.emit('leave-room', roomName);
      }
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  };

  const contextValue = {
    socket,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    emitEvent,
    joinRoom,
    leaveRoom,
    error
  };

  return (
    <SocketContext.Provider value={contextValue}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      
      {/* Connection Status Indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="socket-status-indicator">
          <div className={`status-dot ${connectionStatus}`}></div>
          <span className="status-text">
            Socket: {connectionStatus}
            {socket && socket.connected && ` (${socket.id})`}
          </span>
        </div>
      )}
    </SocketContext.Provider>
  );
};

// Simple loading component
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

// Component to handle scroll restoration
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Main App Component
function App() {
  // Global error catcher
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error || event.reason);
      
      // Send to error tracking service (mock)
      if (window.errorLogService) {
        window.errorLogService.logError(event.error || event.reason);
      }
      
      // Prevent default error display
      event.preventDefault();
      
      // Show user-friendly notification
      toast.error('An unexpected error occurred. Please try again.', {
        position: "top-right",
        autoClose: 5000
      });
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled rejection:', event.reason);
      handleGlobalError(event);
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthContextProvider>
        {/* ADDED: Router with future flags to suppress warnings */}
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="App">
            <SocketProvider>
              <ScrollToTop />
              <ErrorBoundary>
                <Header />
              </ErrorBoundary>
              
              <main className="main-content">
                <Suspense fallback={<LoadingSpinner />}>
                  <ErrorBoundary>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/*" element={
                        <ErrorBoundary>
                          <PublicRoutes />
                        </ErrorBoundary>
                      } />
                      
                      {/* ADMIN LOGIN ROUTE - ADDED */}
                      <Route 
                        path="/admin-login" 
                        element={
                          <ErrorBoundary>
                            <AdminLogin />
                          </ErrorBoundary>
                        } 
                      />
                      
                      {/* Protected Member Routes */}
                      <Route 
                        path="/dashboard/*" 
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <MemberRoutes />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Protected Admin Routes */}
                      <Route 
                        path="/admin/*" 
                        element={
                          <ProtectedRoute adminOnly={true}>
                            <ErrorBoundary>
                              <AdminRoutes />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Error Pages */}
                      <Route path="/unauthorized" element={<Unauthorized />} />
                      <Route path="/404" element={<NotFound />} />
                      
                      {/* Fallback Routes */}
                      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                      <Route path="/dashboard/member" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </ErrorBoundary>
                </Suspense>
              </main>
              
              {/* Toast Notifications */}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </SocketProvider>
          </div>
        </Router>
      </AuthContextProvider>
    </ErrorBoundary>
  );
}

export default App;