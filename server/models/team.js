const mongoose = require('mongoose');
const EventEmitter = require('events');

const {notificationEvent} = require('./notification');

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
  pending: [rosterSchema],
  feed: [feedSchema],
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'League' }]
});

teamSchema.pre('save', function() {
  if (!this.isNew) { return; }

  teamEvent.emit('new', this);
});

teamSchema.statics.invite = async function(teamId, userId, accepted) {
  const team = await this.findById(teamId, 'roster pending');
  
  const match = team.pending.find(p => p.user.toString() === userId);
  if (!match) { return; }

  team.pending = team.pending.filter(p => p.user.toString() === userId);

  if (accepted) { team.roster.push(match); }

  await team.save();
}

const Team = mongoose.model('Team', teamSchema);

notificationEvent.on('teamInvite', Team.invite.bind(Team));

module.exports = {Team, teamEvent};