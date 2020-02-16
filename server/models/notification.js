const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  action: { type: String, required: true },
  league: {
    type: mongoose.Types.ObjectId,
    ref: 'League'
  },
  team: {
    type: mongoose.Types.ObjectId,
    ref: 'Team'
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  status: {
    pending: { type: Boolean },
    accepted: { type: Boolean },
    read: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;