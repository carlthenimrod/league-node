const mongoose = require('mongoose');
const EventEmitter = require('events');

const teamEvent = new EventEmitter();

const rosterSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  roles: [String]
}, { _id: false });

const feedSchema = new mongoose.Schema({
  type: String,
  body: String,
  from: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    new: {
      type: Boolean,
      default: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  roster: [rosterSchema],
  pending: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  feed: [feedSchema],
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'League' }]
});

teamSchema.pre('save', function() {
  if (!this.isNew) { return; }

  teamEvent.emit('new', this);
});

const Team = mongoose.model('Team', teamSchema);

module.exports = {Team, teamEvent};