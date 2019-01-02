const mongoose = require('mongoose');

const {Team} = require('./team');

const gameSchema = new mongoose.Schema({
  home: {
    _id: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number
    }
  },
  away: {
    _id: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number
    }
  },
  start: Date
});

const Game = mongoose.model('Game', gameSchema);

module.exports = {Game};