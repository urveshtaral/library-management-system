import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './Stats.css';

import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';
import BookIcon from '@material-ui/icons/Book';
import EventIcon from '@material-ui/icons/Event';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import PeopleIcon from '@material-ui/icons/People';
import TrendingDown from '@material-ui/icons/TrendingDown';

function Stats() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [realTimeStats, setRealTimeStats] = useState({});
    const [socketEnabled, setSocketEnabled] = useState(true);

    useEffect(() => {
        const shouldUseSocket = process.env.REACT_APP_ENABLE_SOCKET !== 'false';
        setSocketEnabled(shouldUseSocket);
    }, []);

    useEffect(() => {
        const fetchInitialStats = async () => {
            try {
                const mockStats = {
                    totalBooks: 12543,
                    totalUsers: 8421,
                    activeTransactions: 3124,
                    upcomingEvents: 8,
                    availableBooks: 9419,
                    dailyVisitors: "250+"
                };
                setStats(mockStats);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching initial stats:', error);
                setLoading(false);
            }
        };

        fetchInitialStats();
        
        if (socketEnabled) {
            const fetchRealTimeStats = async () => {
                try {
                    const response = await fetch('/api/stats/realtime');
                    const data = await response.json();
                    if (data.success) {
                        setRealTimeStats(data.data);
                    }
                } catch (error) {
                    console.error('Error fetching real-time stats:', error);
                }
            };
            
            fetchRealTimeStats();
            
            let socket;
            try {
                socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000');
                
                socket.on('stats-update', (data) => {
                    setRealTimeStats(data);
                });
                
                if (window.appSocket) {
                    window.appSocket.on('stats-update', (newStats) => {
                        setRealTimeStats(newStats);
                    });
                }
                
            } catch (error) {
                console.error('Socket connection error:', error);
            }
            
            return () => {
                if (socket) {
                    socket.disconnect();
                }
                if (window.appSocket) {
                    window.appSocket.off('stats-update');
                }
            };
        } else {
            console.log('Socket connections disabled for Stats component');
        }
    }, [socketEnabled]);

    const mergedStats = {
        ...stats,
        ...realTimeStats
    };

    if (loading) {
        return (
            <div className="stats">
                <div className="stats-bg-animation">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="floating-shape shape-3"></div>
                    <div className="floating-shape shape-4"></div>
                    <div className="data-particles"></div>
                </div>
                <div className="stats-loading">
                    <div className="loading-spinner">📊</div>
                    Loading Library Statistics...
                </div>
            </div>
        );
    }

    const statCards = [
        {
            icon: <LibraryBooksIcon />,
            title: "Total Books",
            value: mergedStats.totalBooks?.toLocaleString() || "0",
            color: "#00e5ff",
            description: "In our collection",
            trend: "+5.2%",
            positive: true
        },
        {
            icon: <LocalLibraryIcon />,
            title: "Active Members",
            value: mergedStats.totalUsers?.toLocaleString() || "0",
            color: "#ffd166",
            description: "Registered users",
            trend: "+12.7%",
            positive: true
        },
        {
            icon: <BookIcon />,
            title: "Books Issued",
            value: mergedStats.activeTransactions?.toLocaleString() || "0",
            color: "#4facfe",
            description: "Currently borrowed",
            trend: "+8.3%",
            positive: true
        },
        {
            icon: <EventIcon />,
            title: "Upcoming Events",
            value: mergedStats.upcomingEvents || "0",
            color: "#f093fb",
            description: "This month",
            trend: "+2.1%",
            positive: true
        },
        {
            icon: <TrendingUpIcon />,
            title: "Available Books",
            value: mergedStats.availableBooks?.toLocaleString() || "0",
            color: "#43e97b",
            description: "Ready to borrow",
            trend: "+3.8%",
            positive: true
        },
        {
            icon: <PeopleIcon />,
            title: "Daily Visitors",
            value: mergedStats.dailyVisitors || "250+",
            color: "#ff6b6b",
            description: "Average per day",
            trend: "+15.4%",
            positive: true
        }
    ];

    return (
        <div className='stats'>
            <div className="stats-bg-animation">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
                <div className="floating-shape shape-4"></div>
                <div className="data-particles"></div>
            </div>

            <div className="container">
                <div className="stats-header">
                    <h2 className="stats-title">Library Analytics</h2>
                    <p className="stats-subtitle">Real-time insights and statistics of Vadodara Central Library</p>
                </div>
                
                <div className="stats-grid">
                    {statCards.map((stat, index) => (
                        <div 
                            key={index} 
                            className='stats-card'
                            style={{ '--color': stat.color }}
                        >
                            <div className="card-glow"></div>
                            <div className="stats-icon-container">
                                <div 
                                    className="stats-icon" 
                                    style={{ color: stat.color }}
                                >
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="stats-content">
                                <h3 className="stats-value">{stat.value}</h3>
                                <p className="stats-title-text">{stat.title}</p>
                                <span className="stats-description">{stat.description}</span>
                            </div>
                            <div className={`stats-trend ${!stat.positive ? 'negative' : ''}`}>
                                {stat.positive ? <TrendingUpIcon className="trend-icon" /> : <TrendingDown className="trend-icon" />}
                                {stat.trend}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="stats-footer">
                    <p>
                        <span>📊</span>
                        Last updated: {new Date().toLocaleDateString('en-IN', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Stats;