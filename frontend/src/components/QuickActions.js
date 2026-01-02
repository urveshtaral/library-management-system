import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import './QuickActions.css';

import BookIcon from '@material-ui/icons/Book';
import EventIcon from '@material-ui/icons/Event';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import ComputerIcon from '@material-ui/icons/Computer';
import PaymentIcon from '@material-ui/icons/Payment';
import NotificationsIcon from '@material-ui/icons/Notifications';
import WarningIcon from '@material-ui/icons/Warning';

function QuickActions() {
  const [availableActions, setAvailableActions] = useState([
    {
      icon: <SearchIcon />,
      title: "Search Books",
      description: "Find books by title, author, or category",
      link: "/books",
      urgent: false
    },
    {
      icon: <BookIcon />,
      title: "Browse Catalog",
      description: "Explore our complete collection",
      link: "/books",
      urgent: false
    },
    {
      icon: <EventIcon />,
      title: "Upcoming Events",
      description: "Join workshops and competitions",
      link: "/events",
      urgent: false
    },
    {
      icon: <PersonIcon />,
      title: "My Account",
      description: "Manage your profile and books",
      link: "/profile",
      urgent: false
    },
    {
      icon: <TrendingUpIcon />,
      title: "Popular Reads",
      description: "See what others are reading",
      link: "/books?sort=popularity",
      urgent: false
    },
    {
      icon: <ComputerIcon />,
      title: "Digital Library",
      description: "Access e-books online",
      link: "/digital",
      urgent: false
    }
  ]);

  const [hasOverdueBooks, setHasOverdueBooks] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [socketEnabled, setSocketEnabled] = useState(true);

  useEffect(() => {
    const shouldUseSocket = process.env.REACT_APP_ENABLE_SOCKET !== 'false';
    setSocketEnabled(shouldUseSocket);

    if (!socketEnabled) {
      console.log('Socket connections disabled for QuickActions component');
      return;
    }

    let socket;
    try {
      socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000');
      
      socket.on('user-status', (status) => {
        if (status.hasOverdueBooks) {
          setHasOverdueBooks(true);
          setAvailableActions(prev => {
            const filteredActions = prev.filter(a => a.title !== 'Pay Overdue Fines');
            
            return [
              {
                icon: <PaymentIcon />,
                title: "Pay Overdue Fines",
                description: "Clear your pending fines",
                link: "/dashboard/fines",
                urgent: true
              },
              ...filteredActions
            ].slice(0, 6);
          });
        } else {
          setHasOverdueBooks(false);
        }
        
        if (status.hasNewNotifications) {
          setHasNewNotifications(true);
          setAvailableActions(prev => {
            return prev.map(action => 
              action.title === "My Account" 
                ? { 
                    ...action, 
                    description: "View new notifications",
                    icon: <NotificationsIcon style={{ color: '#ff4757' }} />
                  } 
                : action
            );
          });
        }
      });
      
      socket.on('new-fine-added', (fineData) => {
        if (fineData.userId === 'current-user-id') {
          setAvailableActions(prev => {
            return [
              {
                icon: <WarningIcon />,
                title: "New Fine Added",
                description: `₹${fineData.amount} due for overdue book`,
                link: "/dashboard/fines",
                urgent: true
              },
              ...prev.filter(a => a.title !== 'New Fine Added')
            ].slice(0, 6);
          });
        }
      });
      
      socket.on('book-due-soon', (bookData) => {
        setAvailableActions(prev => {
          if (!prev.find(a => a.title === 'Renew Book')) {
            return [
              {
                icon: <BookIcon />,
                title: "Renew Book",
                description: `${bookData.bookName} is due soon`,
                link: "/dashboard/books",
                urgent: true
              },
              ...prev
            ].slice(0, 6);
          }
          return prev;
        });
      });
      
      socket.on('new-event-added', (eventData) => {
        setAvailableActions(prev => {
          return prev.map(action => 
            action.title === "Upcoming Events" 
              ? { 
                  ...action, 
                  description: `New: ${eventData.title}`,
                  icon: <EventIcon style={{ color: '#2ed573' }} />
                } 
              : action
          );
        });
      });
      
      socket.emit('get-user-status');
      
    } catch (error) {
      console.error('Socket connection error:', error);
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socketEnabled]);

  return (
    <div className="quick-actions">
      <div className="container">
        <h2 className="section-title">Quick Access</h2>
        <p className="section-subtitle">Everything you need, just a click away</p>
        
        {hasOverdueBooks && (
          <div className="urgent-alert">
            <WarningIcon />
            <span>You have overdue books. Please pay fines to continue borrowing.</span>
          </div>
        )}
        
        <div className="actions-grid">
          {availableActions.map((action, index) => (
            <Link 
              to={action.link} 
              key={index} 
              className={`action-card ${action.urgent ? 'urgent' : ''}`}
            >
              <div className="action-icon">
                {action.icon}
                {action.urgent && <span className="urgent-badge">!</span>}
              </div>
              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>
              <div className="action-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuickActions;