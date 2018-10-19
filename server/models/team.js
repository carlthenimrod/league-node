const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division'
  }
});

const Team = mongoose.model('Team', TeamSchema);

module.exports = {Team};