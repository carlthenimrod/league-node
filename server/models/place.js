const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  label: {
    type: String,
    trim: true,
    required: true
  },
  address: {
    street: {type: String, trim: true},
    city: {type: String, trim: true},
    state: {type: String, trim: true},
    postal: {type: String, trim: true}
  },
  locations: [{ 
    name: { type: String, required: true, trim: true }
  }],
  permits: [{ 
    start: Date,
    end: Date,
    games: [{
      _id: mongoose.Schema.Types.ObjectId,
      locations: [mongoose.Schema.Types.ObjectId],
      start: Date,
      end: Date
    }]
  }]
});

const Place = mongoose.model('Place', placeSchema);

module.exports = {Place};