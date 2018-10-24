const mongoose = require('mongoose');

const {Division} = require('./division');
const {Team} = require('./team');

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
  divisions: [Division.schema],
  teams: [Team.schema],
  start: Date,
  end: Date
});

const League = mongoose.model('League', leagueSchema);

module.exports = {League};