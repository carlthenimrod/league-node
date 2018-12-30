const mongoose = require('mongoose');

const {Notice} = require('./notice');

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
  roster: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roles: [String]
  }]
});

teamSchema.pre('save', async function () {
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
});

const Team = mongoose.model('Team', teamSchema);

module.exports = {Team};