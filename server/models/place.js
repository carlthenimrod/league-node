const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
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
  locations: [{ name: String }],
  permits: [{ 
    label: String,
    slots: [{
      start: Date,
      end: Date,
      games: [{
        _id: mongoose.Schema.Types.ObjectId,
        locations: [mongoose.Schema.Types.ObjectId],
        start: Date
      }]
    }]
  }]
});

placeSchema.methods.saveSlot = async function (game) {
  console.log(this);
  console.log(game);
};

const Place = mongoose.model('Place', placeSchema);

module.exports = {Place};