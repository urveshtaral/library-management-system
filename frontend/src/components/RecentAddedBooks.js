import React from 'react'
import './RecentAddedBooks.css'

function RecentAddedBooks() {
    const recentBooks = [
        {
            id: 1,
            title: "Atomic Habits",
            author: "James Clear",
            cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: true
        },
        {
            id: 2,
            title: "Ikigai",
            author: "Héctor García",
            cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: true
        },
        {
            id: 3,
            title: "The Psychology of Money",
            author: "Morgan Housel",
            cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: true
        },
        {
            id: 4,
            title: "Deep Work",
            author: "Cal Newport",
            cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: true
        },
        {
            id: 5,
            title: "Thinking Fast and Slow",
            author: "Daniel Kahneman",
            cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: false
        },
        {
            id: 6,
            title: "The Alchemist",
            author: "Paulo Coelho",
            cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: false
        },
        {
            id: 7,
            title: "Sapiens",
            author: "Yuval Noah Harari",
            cover: "https://images.unsplash.com/photo-1551029506-0807df4e2031?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: true
        },
        {
            id: 8,
            title: "The Midnight Library",
            author: "Matt Haig",
            cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            isNew: true
        }
    ];

    return (
        <div className='recentaddedbooks-container'>
            <h2 className='recentbooks-title'>📚 New Arrivals</h2>
            <div className='recentbooks'>
                <div className='images'>
                    {recentBooks.map(book => (
                        <div key={book.id} style={{position: 'relative'}}>
                            <img 
                                className='recent-book' 
                                src={book.cover} 
                                alt={book.title}
                            />
                            {book.isNew && <div className="new-badge">NEW</div>}
                            <div className="book-info-overlay">
                                <div className="book-title">{book.title}</div>
                                <div className="book-author">By {book.author}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='images'>
                    {recentBooks.map(book => (
                        <div key={book.id + "-dup"} style={{position: 'relative'}}>
                            <img 
                                className='recent-book' 
                                src={book.cover} 
                                alt={book.title}
                            />
                            {book.isNew && <div className="new-badge">NEW</div>}
                            <div className="book-info-overlay">
                                <div className="book-title">{book.title}</div>
                                <div className="book-author">By {book.author}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default RecentAddedBooks