const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  start: Date,
  end: Date
});

const League = mongoose.model('League', leagueSchema);

module.exports = {League};