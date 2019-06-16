const mongoose = require('mongoose');

const {Notice} = require('./notice');

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
  feed: [feedSchema],
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'League' }]
});

const handleNotices = async function () {
  if (this.isNew && this.status.new) {
    await Notice.create({
      notice: 'new',
      item: this._id,
      itemType: 'Team'
    });
  }

  if (!this.isNew && this.isModified('status')) {
    if (this._status === 'new' && this.status !== this._status) {
      await Notice.findOneAndRemove({ item: this._id, notice: 'new' });
    }
  }
};

teamSchema.pre('save', handleNotices);

teamSchema.statics.formatRoster = function (team) {
  const roster = [];

  team = team.toObject();

  for (let i = 0; i < team.roster.length; i++) {
    if (!team.roster[i].user) return;

    const user = team.roster[i].user;
    
    if (team.roster[i].roles) {
      user.roles = [...team.roster[i].roles];
    }
    roster.push(user);
  }

  team.roster = roster;

  return team;
};

const Team = mongoose.model('Team', teamSchema);

module.exports = {Team};