// backend/models/Notification.js - ENHANCED VERSION
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: [
      "info", 
      "warning", 
      "success", 
      "error", 
      "book_due", 
      "book_overdue", 
      "book_available", 
      "reservation_ready", 
      "fine_issued", 
      "fine_paid", 
      "event_reminder", 
      "system_alert"
    ],
    default: "info"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  category: {
    type: String,
    enum: [
      "book_management",
      "fines_payments", 
      "events_activities",
      "system_maintenance",
      "account_updates",
      "promotional"
    ],
    default: "book_management"
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionLabel: {
    type: String,
    trim: true,
    maxlength: 50
  },
  relatedId: {
    type: mongoose.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ["Book", "Transaction", "Fine", "Event", "User"]
  },
  metadata: {
    bookName: String,
    dueDate: Date,
    fineAmount: Number,
    eventDate: Date,
    transactionId: mongoose.Types.ObjectId
  },
  expiresAt: {
    type: Date,
    index: { expires: '7d' } // Auto-delete after 7 days of expiry
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: Date
}, {
  timestamps: true
});

// Compound indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification age
notificationSchema.virtual('ageInDays').get(function() {
  const created = new Date(this.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for urgency status
notificationSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.type === 'book_overdue';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to archive notification
notificationSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadByUser = function(userId, limit = 20) {
  return this.find({
    userId: userId,
    isRead: false,
    isArchived: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit)
  .populate('relatedId');
};

// Static method to find all notifications for user
notificationSchema.statics.findByUser = function(userId, options = {}) {
  const {
    limit = 50,
    page = 1,
    read = null,
    type = null,
    category = null
  } = options;

  const query = { userId: userId, isArchived: false };
  
  if (read !== null) query.isRead = read;
  if (type) query.type = type;
  if (category) query.category = category;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('relatedId');
};

// Static method to create book due notification
notificationSchema.statics.createBookDueNotification = function(userId, transaction) {
  const dueDate = new Date(transaction.toDate);
  const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
  
  let priority = 'medium';
  let type = 'book_due';
  
  if (daysUntilDue <= 0) {
    priority = 'urgent';
    type = 'book_overdue';
  } else if (daysUntilDue <= 2) {
    priority = 'high';
  }

  return this.create({
    userId: userId,
    title: daysUntilDue <= 0 ? 
      `Book Overdue: ${transaction.bookName}` : 
      `Book Due Soon: ${transaction.bookName}`,
    message: daysUntilDue <= 0 ?
      `Your book "${transaction.bookName}" is overdue by ${Math.abs(daysUntilDue)} days. Please return it as soon as possible to avoid additional fines.` :
      `Your book "${transaction.bookName}" is due in ${daysUntilDue} days. Please return or renew it before the due date.`,
    type: type,
    priority: priority,
    category: 'book_management',
    actionUrl: `/dashboard/books`,
    actionLabel: 'View My Books',
    relatedId: transaction._id,
    relatedModel: 'Transaction',
    metadata: {
      bookName: transaction.bookName,
      dueDate: dueDate,
      transactionId: transaction._id
    },
    expiresAt: new Date(dueDate.getTime() + (7 * 24 * 60 * 60 * 1000)) // Expire 7 days after due date
  });
};

// Static method to create fine notification
notificationSchema.statics.createFineNotification = function(userId, fine) {
  return this.create({
    userId: userId,
    title: `Fine Issued: ₹${fine.amount}`,
    message: `A fine of ₹${fine.amount} has been issued for ${fine.reason}. Please pay it at your earliest convenience.`,
    type: 'fine_issued',
    priority: 'high',
    category: 'fines_payments',
    actionUrl: `/dashboard/fines`,
    actionLabel: 'Pay Fine',
    relatedId: fine._id,
    relatedModel: 'Fine',
    metadata: {
      fineAmount: fine.amount,
      reason: fine.reason
    },
    expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // Expire after 30 days
  });
};

// Static method to create event reminder
notificationSchema.statics.createEventReminder = function(userId, event, daysBefore = 1) {
  const eventDate = new Date(event.date);
  const reminderDate = new Date(eventDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));
  
  return this.create({
    userId: userId,
    title: `Event Reminder: ${event.title}`,
    message: `Don't forget about "${event.title}" ${daysBefore === 0 ? 'today' : `in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`} at ${event.location}.`,
    type: 'event_reminder',
    priority: 'medium',
    category: 'events_activities',
    actionUrl: `/events/${event._id}`,
    actionLabel: 'View Event',
    relatedId: event._id,
    relatedModel: 'Event',
    metadata: {
      eventDate: eventDate,
      location: event.location
    },
    expiresAt: new Date(eventDate.getTime() + (24 * 60 * 60 * 1000)) // Expire 1 day after event
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { 
      userId: userId, 
      isRead: false 
    },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
};

// Static method to get notification statistics for user
notificationSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        urgent: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Pre-save middleware to set sentAt if not set
notificationSchema.pre('save', function(next) {
  if (!this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

// Pre-save middleware to validate expiry
notificationSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt <= new Date()) {
    this.isArchived = true;
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);