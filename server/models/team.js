const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'active', 'inactive'],
    default: 'new'
  },
  roster: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roles: [String]
  }]
});

const Team = mongoose.model('Team', TeamSchema);

module.exports = {Team};