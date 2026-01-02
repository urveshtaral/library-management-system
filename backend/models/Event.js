// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    type: {
        type: String,
        enum: ["Competition", "Quiz", "Workshop", "Seminar", "Book Launch", "Author Talk", "Reading Session"],
        required: true
    },
    participants: [{
        type: mongoose.Types.ObjectId,
        ref: "User"
    }],
    maxParticipants: {
        type: Number,
        default: 50
    },
    status: {
        type: String,
        enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
        default: "Upcoming"
    },
    image: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: "Library Main Hall"
    },
    organizer: {
        type: String,
        default: "Library Management"
    },
    requirements: [String],
    registrationLink: String
}, {
    timestamps: true
});

module.exports = mongoose.model("Event", eventSchema);