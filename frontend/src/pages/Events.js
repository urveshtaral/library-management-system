// src/pages/Events.js - FIXED WITH CORRECT ICON IMPORTS
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './Events.css';

import EventIcon from '@material-ui/icons/Event';
import PeopleIcon from '@material-ui/icons/People';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import BookIcon from '@material-ui/icons/Book';
import SchoolIcon from '@material-ui/icons/School';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
// Replace QuizIcon with a different icon since it doesn't exist
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'; // Using HelpOutline for Quiz

function Events() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [upcomingOnly, setUpcomingOnly] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, [filter, upcomingOnly]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
            
            const params = {};
            if (filter !== 'all') params.type = filter;
            if (upcomingOnly) params.upcoming = 'true';
            
            const response = await axios.get(`${API_URL}/events/allevents`, { params });
            
            if (response.data.success) {
                setEvents(response.data.data || []);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('❌ Error fetching events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEventRegistration = async (eventId, eventTitle) => {
        try {
            if (!user) {
                alert('Please login to register for events');
                return;
            }

            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
            const response = await axios.post(`${API_URL}/events/register`, {
                eventId: eventId,
                userId: user.id || user._id
            });

            if (response.data.success) {
                alert(`Successfully registered for "${eventTitle}"!`);
                fetchEvents();
            }
        } catch (error) {
            console.error('❌ Error registering for event:', error);
            alert(error.response?.data?.message || 'Error registering for event');
        }
    };

    const handleCancelRegistration = async (eventId, eventTitle) => {
        try {
            if (!user) {
                alert('Please login to manage event registrations');
                return;
            }

            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
            const response = await axios.post(`${API_URL}/events/cancel-registration`, {
                eventId: eventId,
                userId: user.id || user._id
            });

            if (response.data.success) {
                alert(`Successfully cancelled registration for "${eventTitle}"`);
                fetchEvents();
            }
        } catch (error) {
            console.error('❌ Error cancelling registration:', error);
            alert(error.response?.data?.message || 'Error cancelling registration');
        }
    };

    const handleAddToCalendar = (event) => {
        const eventDate = new Date(event.date);
        const endDate = new Date(eventDate.getTime() + (event.duration || 2) * 60 * 60 * 1000);
        
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${eventDate.toISOString().replace(/-|:|\.\d+/g, '')}/${endDate.toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
        window.open(calendarUrl, '_blank');
    };

    const eventTypes = [
        { value: 'all', label: 'All Events', icon: <EventIcon /> },
        { value: 'Workshop', label: 'Workshops', icon: <GroupWorkIcon /> },
        { value: 'Seminar', label: 'Seminars', icon: <SchoolIcon /> },
        { value: 'Competition', label: 'Competitions', icon: <EmojiEventsIcon /> },
        { value: 'Quiz', label: 'Quizzes', icon: <HelpOutlineIcon /> }, // Fixed: Using HelpOutlineIcon
        { value: 'Book Launch', label: 'Book Launches', icon: <BookIcon /> },
        { value: 'Author Talk', label: 'Author Talks', icon: <PeopleIcon /> }
    ];

    const getEventIcon = (type) => {
        const eventType = eventTypes.find(t => t.value === type);
        return eventType ? eventType.icon : <EventIcon />;
    };

    const getEventStatus = (event) => {
        const now = new Date();
        const eventDate = new Date(event.date);
        
        if (event.status === 'Completed') return 'completed';
        if (event.status === 'Cancelled') return 'cancelled';
        if (eventDate < now) return 'completed';
        if (event.participants?.length >= event.maxParticipants) return 'full';
        return 'upcoming';
    };

    const isUserRegistered = (event) => {
        if (!user) return false;
        return event.participants?.some(participant => 
            participant.userId === (user.id || user._id) || 
            participant._id === (user.id || user._id)
        );
    };

    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            time: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        };
    };

    const handleProposeEvent = () => {
        alert('Event proposal feature coming soon!');
    };

    const handleContactCoordinator = () => {
        alert('Contact feature coming soon!');
    };

    if (loading) {
        return (
            <div className="events-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>Loading Events...</h2>
                    <p>Discovering amazing events for you</p>
                </div>
            </div>
        );
    }

    return (
        <div className='events-page'>
            <div className="events-header">
                <div className="container">
                    <h1>Library Events & Programs</h1>
                    <p>Join our vibrant community of readers and learners. Explore workshops, seminars, and cultural events.</p>
                    
                    <div className="events-controls">
                        <div className="filter-toggle">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={upcomingOnly}
                                    onChange={(e) => setUpcomingOnly(e.target.checked)}
                                    aria-label="Show upcoming events only"
                                />
                                <span className="toggle-slider"></span>
                                Show Upcoming Events Only
                            </label>
                        </div>

                        <div className="events-filter" role="tablist" aria-label="Filter events by type">
                            {eventTypes.map(type => (
                                <button
                                    key={type.value}
                                    className={`filter-btn ${filter === type.value ? 'active' : ''}`}
                                    onClick={() => setFilter(type.value)}
                                    role="tab"
                                    aria-selected={filter === type.value}
                                    aria-label={`Show ${type.label.toLowerCase()}`}
                                >
                                    <span className="filter-icon" aria-hidden="true">{type.icon}</span>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="events-container">
                <div className="container">
                    <div className="events-stats" role="status" aria-label="Event statistics">
                        <div className="stat-item">
                            <strong>{events.length}</strong>
                            <span>Total Events</span>
                        </div>
                        <div className="stat-item">
                            <strong>{events.filter(e => getEventStatus(e) === 'upcoming').length}</strong>
                            <span>Upcoming</span>
                        </div>
                        <div className="stat-item">
                            <strong>{events.filter(e => getEventStatus(e) === 'full').length}</strong>
                            <span>Fully Booked</span>
                        </div>
                        <div className="stat-item">
                            <strong>{events.filter(e => isUserRegistered(e)).length}</strong>
                            <span>Your Registrations</span>
                        </div>
                    </div>

                    <div className="events-grid" role="list" aria-label="Events list">
                        {events.map(event => {
                            const eventStatus = getEventStatus(event);
                            const formattedDate = formatEventDate(event.date);
                            const participantsCount = event.participants?.length || 0;
                            const spotsLeft = event.maxParticipants - participantsCount;
                            const userRegistered = isUserRegistered(event);
                            
                            return (
                                <article key={event._id} className={`event-card ${eventStatus}`} role="listitem">
                                    <div className="event-image">
                                        <img
                                            src={event.image || getEventImage(event.type)}
                                            alt={`${event.title} event`}
                                            onError={(e) => {
                                                e.target.src = getEventImage(event.type);
                                            }}
                                        />
                                        <div className="event-type-badge">
                                            <span aria-hidden="true">{getEventIcon(event.type)}</span>
                                            <span>{event.type}</span>
                                        </div>
                                        <div className={`event-status-badge ${eventStatus}`}>
                                            {eventStatus === 'upcoming' && 'Upcoming'}
                                            {eventStatus === 'full' && 'Fully Booked'}
                                            {eventStatus === 'completed' && 'Completed'}
                                            {eventStatus === 'cancelled' && 'Cancelled'}
                                        </div>
                                        {userRegistered && (
                                            <div className="registered-badge" aria-label="You are registered for this event">
                                                ✓ Registered
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="event-content">
                                        <h2 className="event-title">{event.title}</h2>
                                        <p className="event-description">{event.description}</p>
                                        
                                        <div className="event-details">
                                            <div className="detail-item">
                                                <CalendarTodayIcon className="detail-icon" aria-hidden="true" />
                                                <div>
                                                    <span className="detail-label">Date</span>
                                                    <span className="detail-value">{formattedDate.date}</span>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <AccessTimeIcon className="detail-icon" aria-hidden="true" />
                                                <div>
                                                    <span className="detail-label">Time</span>
                                                    <span className="detail-value">{formattedDate.time}</span>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <LocationOnIcon className="detail-icon" aria-hidden="true" />
                                                <div>
                                                    <span className="detail-label">Location</span>
                                                    <span className="detail-value">{event.location}</span>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <PeopleIcon className="detail-icon" aria-hidden="true" />
                                                <div>
                                                    <span className="detail-label">Participants</span>
                                                    <span className="detail-value">
                                                        {participantsCount} / {event.maxParticipants} registered
                                                        {spotsLeft > 0 && (
                                                            <span className="spots-left"> ({spotsLeft} spots left)</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="progress-bar" aria-label={`${participantsCount} out of ${event.maxParticipants} participants registered`}>
                                            <div 
                                                className="progress-fill"
                                                style={{ 
                                                    width: `${(participantsCount / event.maxParticipants) * 100}%` 
                                                }}
                                            ></div>
                                        </div>
                                        
                                        <div className="event-actions">
                                            {userRegistered ? (
                                                <>
                                                    <button 
                                                        className="btn-registered"
                                                        disabled
                                                        aria-label="You are registered for this event"
                                                    >
                                                        ✓ Registered
                                                    </button>
                                                    <button 
                                                        className="btn-cancel"
                                                        onClick={() => handleCancelRegistration(event._id, event.title)}
                                                        aria-label={`Cancel registration for ${event.title}`}
                                                    >
                                                        Cancel Registration
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        className={`btn-primary ${eventStatus !== 'upcoming' ? 'disabled' : ''}`}
                                                        disabled={eventStatus !== 'upcoming'}
                                                        onClick={() => handleEventRegistration(event._id, event.title)}
                                                        aria-label={`Register for ${event.title}`}
                                                        aria-disabled={eventStatus !== 'upcoming'}
                                                    >
                                                        {eventStatus === 'full' ? 'Event Full' : 
                                                         eventStatus === 'completed' ? 'Event Ended' :
                                                         eventStatus === 'cancelled' ? 'Cancelled' :
                                                         'Register Now'}
                                                    </button>
                                                    <button 
                                                        className="btn-secondary"
                                                        onClick={() => handleAddToCalendar(event)}
                                                        disabled={eventStatus !== 'upcoming'}
                                                        aria-label={`Add ${event.title} to calendar`}
                                                    >
                                                        Add to Calendar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    
                    {events.length === 0 && (
                        <div className="no-events">
                            <EventIcon style={{ fontSize: 80, color: '#ccc', marginBottom: '20px' }} aria-hidden="true" />
                            <h2>No events found</h2>
                            <p>We couldn't find any events matching your criteria.</p>
                            <div className="no-events-actions">
                                <button 
                                    className="btn-primary"
                                    onClick={() => {
                                        setFilter('all');
                                        setUpcomingOnly(false);
                                    }}
                                    aria-label="View all events"
                                >
                                    View All Events
                                </button>
                                <button className="btn-secondary" onClick={handleProposeEvent}>
                                    Suggest an Event
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="events-cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Want to Host an Event?</h2>
                        <p>Have an idea for a workshop, book club, or community event? We'd love to hear from you!</p>
                        <div className="cta-buttons">
                            <button className="cta-button primary" onClick={handleProposeEvent}>
                                Propose an Event
                            </button>
                            <button className="cta-button secondary" onClick={handleContactCoordinator}>
                                Contact Event Coordinator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to get event images
const getEventImage = (type) => {
    const images = {
        Workshop: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        Seminar: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        Competition: "https://images.unsplash.com/photo-1536922246289-88c42f957773?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        Quiz: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        'Book Launch': "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        'Author Talk': "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
        default: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    };
    return images[type] || images.default;
};

export default Events;