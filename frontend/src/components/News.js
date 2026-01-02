import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './News.css';

import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import RefreshIcon from '@mui/icons-material/Refresh';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FiberNewIcon from '@mui/icons-material/FiberNew';

function News() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [newEventsCount, setNewEventsCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [socketEnabled, setSocketEnabled] = useState(true);
    
    const prevEventsRef = useRef([]);
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

    // Check socket configuration
    useEffect(() => {
        const shouldUseSocket = process.env.REACT_APP_ENABLE_SOCKET !== 'false';
        setSocketEnabled(shouldUseSocket);
    }, []);

    // Fetch initial events
    useEffect(() => {
        fetchEvents();
    }, []);

    // Setup socket connection for real-time updates
    useEffect(() => {
        if (!socketEnabled) {
            console.log('Socket connections disabled for News component');
            return;
        }
        
        let socket;
        try {
            socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000');
            
            socket.on('new-event', (event) => {
                setEvents(prev => [event, ...prev]);
                setNewEventsCount(prev => prev + 1);
                showNewEventNotification(event);
            });
            
            socket.on('event-updated', (updatedEvent) => {
                setEvents(prev => prev.map(event => 
                    event._id === updatedEvent._id ? updatedEvent : event
                ));
            });
            
            socket.on('connect', () => {
                console.log('News socket connected');
                setConnectionStatus('connected');
            });
            
            socket.on('disconnect', () => {
                setConnectionStatus('disconnected');
            });
            
            socket.on('connect_error', () => {
                setConnectionStatus('error');
            });
            
        } catch (error) {
            console.error('Socket connection error:', error);
            setConnectionStatus('error');
        }
        
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [socketEnabled]);

    // Real-time updates polling (fallback)
    useEffect(() => {
        const fetchRealTimeNews = async () => {
            try {
                const response = await axios.get(`${API_URL}/events/allevents`, {
                    params: {
                        upcoming: true,
                        limit: 10
                    }
                });
                
                if (response.data.success) {
                    const newEvents = response.data.data || [];
                    setLastUpdate(new Date());
                    
                    // Check for new events
                    const prevEventIds = prevEventsRef.current.map(e => e._id);
                    const currentNewEvents = newEvents.filter(e => !prevEventIds.includes(e._id));
                    
                    if (currentNewEvents.length > 0 && prevEventsRef.current.length > 0) {
                        setNewEventsCount(prev => prev + currentNewEvents.length);
                        showNewEventsNotification(currentNewEvents);
                    }
                    
                    setEvents(newEvents);
                    prevEventsRef.current = newEvents;
                    setConnectionStatus('connected');
                }
            } catch (error) {
                console.error('Error fetching real-time news:', error);
                setConnectionStatus('disconnected');
            }
        };

        // Initial fetch
        fetchRealTimeNews();
        
        // Poll every 30 seconds for updates (fallback if websocket fails)
        const interval = setInterval(fetchRealTimeNews, 30000);
        
        // Cleanup
        return () => clearInterval(interval);
    }, [API_URL]);

    const fetchEvents = async () => {
        try {
            setIsRefreshing(true);
            const response = await axios.get(`${API_URL}/events/allevents`, {
                params: {
                    upcoming: true,
                    limit: 10
                }
            });
            
            if (response.data.success) {
                const fetchedEvents = response.data.data || [];
                setEvents(fetchedEvents);
                setLastUpdate(new Date());
                setNewEventsCount(0); // Reset new events counter on manual refresh
                prevEventsRef.current = fetchedEvents;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            // Fallback to mock data if API fails
            const mockEvents = getMockEvents();
            setEvents(mockEvents);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const getMockEvents = () => {
        return [
            {
                _id: '1',
                type: 'Competition',
                title: 'Annual Literary Awards 2024',
                description: 'Showcase your writing skills in our prestigious literary competition with exciting prizes and recognition.',
                date: '2024-03-15',
                location: 'Main Auditorium',
                participants: Array(45).fill('participant')
            },
            {
                _id: '2',
                type: 'Competition',
                title: 'Digital Art Challenge',
                description: 'Create stunning digital artwork inspired by classic literature. Open to all age groups.',
                date: '2024-03-20',
                location: 'Digital Lab',
                participants: Array(32).fill('participant')
            },
            {
                _id: '3',
                type: 'Quiz',
                title: 'History Trivia Night',
                description: 'Test your knowledge of historical events and figures in this exciting quiz competition.',
                date: '2024-03-18',
                location: 'Conference Hall',
                participants: Array(28).fill('participant')
            },
            {
                _id: '4',
                type: 'Quiz',
                title: 'Science & Technology Quiz',
                description: 'Challenge your scientific knowledge with questions from various fields of science and tech.',
                date: '2024-03-22',
                location: 'Science Wing',
                participants: Array(35).fill('participant')
            }
        ];
    };

    const showNewEventNotification = (event) => {
        if (Notification.permission === 'granted') {
            new Notification('New Library Event!', {
                body: `${event.title} - ${event.type}`,
                icon: '/favicon.ico'
            });
        }
        
        const customEvent = new CustomEvent('showToast', {
            detail: {
                message: `New ${event.type}: ${event.title}`,
                type: 'info'
            }
        });
        window.dispatchEvent(customEvent);
    };

    const showNewEventsNotification = (newEvents) => {
        if (Notification.permission === 'granted') {
            new Notification('New Library Events!', {
                body: `${newEvents.length} new event${newEvents.length > 1 ? 's' : ''} available`,
                icon: '/favicon.ico'
            });
        }
        
        const event = new CustomEvent('showToast', {
            detail: {
                message: `${newEvents.length} new event${newEvents.length > 1 ? 's' : ''} just added!`,
                type: 'info'
            }
        });
        window.dispatchEvent(event);
    };

    const competitions = events.filter(event => event.type === 'Competition');
    const quizzes = events.filter(event => event.type === 'Quiz');

    const handleManualRefresh = () => {
        fetchEvents();
    };

    const handleRegister = async (eventId, eventTitle) => {
        try {
            console.log('Registering for event:', eventId);
            alert(`Registering for "${eventTitle}"...`);
        } catch (error) {
            console.error('Error registering:', error);
        }
    };

    const handleSubscribe = () => {
        alert('Newsletter subscription feature coming soon!');
    };

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (loading) {
        return (
            <div className="news-loading">
                <div className="loading-spinner"></div>
                <p>Loading latest updates...</p>
            </div>
        );
    }

    return (
        <div className='news-container'>
            <div className={`real-time-status ${connectionStatus}`}>
                <div className="status-dot"></div>
                <span className="status-text">
                    {connectionStatus === 'connected' ? 'Live Updates' : 'Offline Mode'}
                </span>
                {lastUpdate && (
                    <span className="last-update">
                        Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                {newEventsCount > 0 && (
                    <div className="new-events-badge">
                        <FiberNewIcon className="new-icon" />
                        <span>{newEventsCount} new</span>
                    </div>
                )}
            </div>

            <div className="news-bg-animation">
                <div className="floating-orb orb-1"></div>
                <div className="floating-orb orb-2"></div>
                <div className="floating-orb orb-3"></div>
                <div className="floating-orb orb-4"></div>
                <div className="pulse-ring"></div>
            </div>

            <div className="container">
                <div className="news-header">
                    <div className="title-wrapper">
                        <NotificationsActiveIcon className="pulse-icon" />
                        <h2 className='news-title'>Latest Updates & Events</h2>
                        <button 
                            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                            onClick={handleManualRefresh}
                            title="Refresh events"
                            disabled={isRefreshing}
                        >
                            <RefreshIcon />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                    <p className="news-subtitle">Stay informed about library activities, programs, and exclusive opportunities</p>
                    <div className="stats-bar">
                        <div className="stat-item">
                            <TrendingUpIcon />
                            <span>{events.length} Active Events</span>
                        </div>
                        <div className="stat-item">
                            <PeopleIcon />
                            <span>{events.reduce((acc, event) => acc + (event.participants?.length || 0), 0)} Total Participants</span>
                        </div>
                        <div className="stat-item">
                            <EventIcon />
                            <span>{competitions.length + quizzes.length} Upcoming</span>
                        </div>
                    </div>
                </div>
                
                <div className='news-data'>
                    <div className='news-section competition-section'>
                        <div className="section-header">
                            <div className="icon-wrapper">
                                <EmojiEventsIcon className="section-icon" />
                            </div>
                            <h3 className='news-section-title'>Competitions & Contests</h3>
                            <div className="section-badge">{competitions.length} Active</div>
                        </div>
                        <div className="events-list">
                            {competitions.map((event, index) => (
                                <div 
                                    key={event._id} 
                                    className={`news-event-card ${hoveredCard === event._id ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredCard(event._id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="card-glow"></div>
                                    {index < 2 && <div className="new-indicator"><NewReleasesIcon /> NEW</div>}
                                    <div className="event-date">
                                        <CalendarTodayIcon className="date-icon" />
                                        <span>{new Date(event.date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <h4>{event.title}</h4>
                                    <p>{event.description}</p>
                                    <div className="event-meta">
                                        <div className="meta-item">
                                            <PeopleIcon className="meta-icon" />
                                            <span>{event.participants?.length || 0} registered</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="event-location">{event.location}</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="register-btn glow-effect"
                                        onClick={() => handleRegister(event._id, event.title)}
                                    >
                                        <span>Register Now</span>
                                        <div className="btn-shine"></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className='news-section quiz-section'>
                        <div className="section-header">
                            <div className="icon-wrapper">
                                <QuestionAnswerIcon className="section-icon" />
                            </div>
                            <h3 className='news-section-title'>Quiz & Challenges</h3>
                            <div className="section-badge">{quizzes.length} Active</div>
                        </div>
                        <div className="events-list">
                            {quizzes.map((event, index) => (
                                <div 
                                    key={event._id} 
                                    className={`news-event-card ${hoveredCard === event._id ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredCard(event._id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                                >
                                    <div className="card-glow"></div>
                                    {index < 2 && <div className="new-indicator"><NewReleasesIcon /> NEW</div>}
                                    <div className="event-date">
                                        <CalendarTodayIcon className="date-icon" />
                                        <span>{new Date(event.date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <h4>{event.title}</h4>
                                    <p>{event.description}</p>
                                    <div className="event-meta">
                                        <div className="meta-item">
                                            <PeopleIcon className="meta-icon" />
                                            <span>{event.participants?.length || 0} registered</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="event-location">{event.location}</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="register-btn glow-effect"
                                        onClick={() => handleRegister(event._id, event.title)}
                                    >
                                        <span>Join Quiz</span>
                                        <div className="btn-shine"></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="news-cta">
                    <div className="cta-content">
                        <div className="cta-icon">
                            <TrendingUpIcon />
                        </div>
                        <h3>Never Miss an Update!</h3>
                        <p>Subscribe to our newsletter and be the first to know about new events, competitions, and library programs</p>
                        <button 
                            className="cta-button glow-effect"
                            onClick={handleSubscribe}
                        >
                            <span>Subscribe Now</span>
                            <div className="btn-shine"></div>
                        </button>
                    </div>
                    <div className="cta-particles">
                        <div className="particle"></div>
                        <div className="particle"></div>
                        <div className="particle"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default News;