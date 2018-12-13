const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const config = require('../config/config');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email.'
    }
  },
  password: {
    type: String,
    minlength: 6,
    trim: true,
    select: false
  },
  tokens: {
    type: [{ token: String }],
    select: false
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

UserSchema.statics.refreshToken = async function (client, refresh_token) {
  const decoded = jwt.verify(refresh_token, config.refreshToken.secret);
  if (decoded.client !== client) throw new Error();

  const user = await this.findOne({
    'tokens._id': client, 
    'tokens.token': refresh_token
  });
  if (!user) throw new Error();

  const access_token = jwt.sign({
    _id: this._id,
    email: this.email,
    roles: this.roles
  }, config.accessToken.secret, {
    expiresIn: config.accessToken.expiresIn
  });

  return access_token;
};

UserSchema.statics.removeToken = async function (client, refresh_token) {
  const user = await this.findOne({
    'tokens._id': client,
    'tokens.token': refresh_token
  });

  if (!user) return;

  user.tokens.id(client).remove();
  await user.save();
};

UserSchema.methods.generateTokens = async function () {
  const access_token = jwt.sign({
    _id: this._id,
    email: this.email,
    roles: this.roles
  }, config.accessToken.secret, {
    expiresIn: config.accessToken.expiresIn
  });

  const client = new mongoose.mongo.ObjectId();

  const refresh_token = jwt.sign({client}, config.refreshToken.secret, {
    expiresIn: config.refreshToken.expiresIn
  });

  this.tokens.push({
    _id: client, 
    token: refresh_token
  });

  await this.save();

  return {access_token, refresh_token, client};
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};