const mongoose = require('mongoose');
const validator = require('validator');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email.'
    }
  },
  password: {
    type: String,
    minlength: 6,
    required: true,
    trim: true
  }
});

UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 10, (err, hash) => {
      this.password = hash;
      next();
    });
  } else {
    next();
  }
});

UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({email});
  if (!user) throw new Error('User not found.');

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    return user;
  } else {
    throw new Error('Password incorrect.');
  }
};

UserSchema.plugin(uniqueValidator);

const User = mongoose.model('User', UserSchema);

module.exports = {User};