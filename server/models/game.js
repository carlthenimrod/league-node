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
  start: Date,
  time: {
    type: Boolean,
    default: false
  },
  place: {
    _id: {
      type: mongoose.Types.ObjectId
    },
    name: {
      type: String,
      trim: true
    },
    address: {
      street: {type: String, trim: true},
      city: {type: String, trim: true},
      state: {type: String, trim: true},
      postal: {type: String, trim: true}
    },
    locations: [{ name: String }]
  }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = {Game};