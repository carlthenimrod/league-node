const mongoose = require('mongoose');

const {Notice} = require('./notice');

const rosterSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  roles: [String]
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'active', 'inactive'],
    default: 'new',
    set: function(status) {
      this._status = this.status;
      return status;
    }
  },
  roster: [rosterSchema]
});

const handleNotices = async function () {
  if (this.isNew && this.status === 'new') {
    await Notice.create({
      notice: 'new',
      item: this._id,
      itemType: 'Team'
    });
  }

  if (!this.isNew && this.isModified('status')) {
    if (this._status === 'new' && this.status !== this._status) {
      await Notice.findOneAndRemove({ item: this._id, notice: 'new' });
    }
  }
};

teamSchema.pre('save', handleNotices);

const Team = mongoose.model('Team', teamSchema);

module.exports = {Team};