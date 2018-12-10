const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  roster: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roles: [String]
  }]
});

const autoPopulateRoster = function(next) {
  this.populate('roster.user');
  next();
};

TeamSchema
  .pre('findOne', autoPopulateRoster)
  .pre('find', autoPopulateRoster);

const Team = mongoose.model('Team', TeamSchema);

module.exports = {Team};