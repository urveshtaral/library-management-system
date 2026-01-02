const express = require("express");
const Event = require("../models/Event.js");
const multer = require("multer");

const router = express.Router();

// Configure multer for event images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/event-images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

/* Get all events with filters */
router.get("/allevents", async (req, res) => {
    try {
        const { type, status, upcoming } = req.query;
        let query = {};
        
        if (type) query.type = type;
        if (status) query.status = status;
        if (upcoming === 'true') query.date = { $gte: new Date() };
        
        const events = await Event.find(query)
            .populate('participants', 'userFullName admissionId employeeId')
            .sort({ date: 1 });
        
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ message: "Error fetching events", error: err.message });
    }
});

/* Create new event */
router.post("/addevent", upload.single('image'), async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            image: req.file ? `/uploads/event-images/${req.file.filename}` : ""
        };
        
        const newEvent = new Event(eventData);
        await newEvent.save();
        
        res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });
    } catch (err) {
        res.status(500).json({ message: "Error creating event", error: err.message });
    }
});

/* Register for event */
router.post("/register", async (req, res) => {
    try {
        const { eventId, userId } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        
        if (event.participants.length >= event.maxParticipants) {
            return res.status(400).json({ message: "Event is full" });
        }
        
        if (event.participants.includes(userId)) {
            return res.status(400).json({ message: "Already registered for this event" });
        }
        
        event.participants.push(userId);
        await event.save();
        
        res.status(200).json({ message: "Successfully registered for the event" });
    } catch (err) {
        res.status(500).json({ message: "Error registering for event", error: err.message });
    }
});

module.exports = router;