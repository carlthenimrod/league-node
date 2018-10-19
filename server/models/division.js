const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

const Division = mongoose.model('Division', DivisionSchema);

module.exports = {Division};