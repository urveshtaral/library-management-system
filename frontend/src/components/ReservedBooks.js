import React, { useState, useEffect } from 'react'
import './ReservedBooks.css'
import axios from 'axios'

function ReservedBooks() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call to get reserved books
        fetchReservedBooks();
    }, []);

    const fetchReservedBooks = async () => {
        try {
            // This would be replaced with actual API call
            const mockReservations = [
                {
                    id: 1,
                    userName: "Rahul Sharma",
                    bookName: "Wings of Fire",
                    reserveDate: "15/12/2023",
                    status: "active",
                    pickupDate: "20/12/2023"
                },
                {
                    id: 2,
                    userName: "Priya Patel",
                    bookName: "The Subtle Art of Not Giving a F*ck",
                    reserveDate: "14/12/2023",
                    status: "ready",
                    pickupDate: "19/12/2023"
                },
                {
                    id: 3,
                    userName: "Amit Kumar",
                    bookName: "Atomic Habits",
                    reserveDate: "13/12/2023",
                    status: "pending",
                    pickupDate: "18/12/2023"
                },
                {
                    id: 4,
                    userName: "Neha Gupta",
                    bookName: "Ikigai",
                    reserveDate: "12/12/2023",
                    status: "active",
                    pickupDate: "17/12/2023"
                },
                {
                    id: 5,
                    userName: "Sanjay Verma",
                    bookName: "The Psychology of Money",
                    reserveDate: "11/12/2023",
                    status: "ready",
                    pickupDate: "16/12/2023"
                }
            ];
            setReservations(mockReservations);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = (reservationId) => {
        if (window.confirm("Are you sure you want to cancel this reservation?")) {
            setReservations(prev => prev.filter(res => res.id !== reservationId));
            // Here you would make API call to cancel reservation
        }
    };

    const handleRenewReservation = (reservationId) => {
        // API call to renew reservation
        alert("Reservation renewed successfully!");
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="status-badge status-active">Active</span>;
            case 'ready':
                return <span className="status-badge status-ready">Ready for Pickup</span>;
            case 'pending':
                return <span className="status-badge status-pending">Pending</span>;
            default:
                return <span className="status-badge status-pending">Pending</span>;
        }
    };

    if (loading) {
        return <div className="loading">Loading reservations...</div>;
    }

    return (
        <div className='reservedbooks-container'>
            <h2 className='reservedbooks-title'>📋 Books On Hold</h2>
            
            {reservations.length > 0 ? (
                <table className='reservedbooks-table'>
                    <thead>
                        <tr>
                            <th>Member Name</th>
                            <th>Book Title</th>
                            <th>Reserved Date</th>
                            <th>Pickup By</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map(reservation => (
                            <tr key={reservation.id}>
                                <td>{reservation.userName}</td>
                                <td>
                                    <strong>{reservation.bookName}</strong>
                                </td>
                                <td>{reservation.reserveDate}</td>
                                <td>{reservation.pickupDate}</td>
                                <td>
                                    {getStatusBadge(reservation.status)}
                                </td>
                                <td>
                                    <button 
                                        className="action-btn btn-cancel"
                                        onClick={() => handleCancelReservation(reservation.id)}
                                    >
                                        Cancel
                                    </button>
                                    {reservation.status === 'active' && (
                                        <button 
                                            className="action-btn btn-renew"
                                            onClick={() => handleRenewReservation(reservation.id)}
                                        >
                                            Renew
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="no-reservations">
                    <h3>No Books Currently Reserved</h3>
                    <p>All books are available for borrowing</p>
                </div>
            )}
        </div>
    )
}

export default ReservedBooks