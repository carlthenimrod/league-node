const mongoose = require('mongoose');

const {Team} = require('./team');

const gameSchema = new mongoose.Schema({
  home: Team.schema,
  away: Team.schema,
  start: Date
});

const Game = mongoose.model('Game', gameSchema);

module.exports = {Game};