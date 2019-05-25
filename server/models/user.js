const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = require('../config/config');
const mailer = require('../config/email');
const {Notice} = require('./notice');

const userSchema = new mongoose.Schema({
  name: {
    first: {type: String, trim: true, required: true},
    last: {type: String, trim: true, required: true}
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
  status: {
    type: String,
    enum: ['new', 'active', 'inactive', 'banned'],
    default: 'new',
    set: function(status) {
      this._status = this.status;
      return status;
    }
  },
  img: String,
  verified: {
    type: Boolean,
    default: false
  },
  teams: [{ name: String }],
  tokens: {
    type: [{ 
      _id: false, 
      client: String,
      token: String, 
      type: {type: String} 
    }],
    select: false
  },
  address: {
    street: {type: String, trim: true},
    city: {type: String, trim: true},
    state: {type: String, trim: true},
    postal: {type: String, trim: true}
  },
  phone: {type: String, trim: true},
  secondary: {type: String, trim: true},
  emergency: {
    name: {
      first: {type: String, trim: true},
      last: {type: String, trim: true}
    },
    phone: {type: String, trim: true},
    secondary: {type: String, trim: true}
  },
  comments: {type: String, trim: true}
}, { 
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

userSchema.virtual('fullName').get(function() {
  return getFullName(this.name);
});

userSchema.virtual('emergency.fullName').get(function() {
  return getFullName(this.emergency.name);
});

const getFullName = function(name) {
  let fullName;

  if (name.first) {
    fullName = name.first;
  }

  if (name.last) {
    if (fullName.length > 0) {
      fullName += (' ' + name.last);
    } else {
      fullName = name.last;
    }
  }

  if (fullName) { return fullName; }
};

const hashPassword = async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
};

const createConfirmationToken = async function () {
  if (this.isNew && !this.password) {
    const code = crypto.randomBytes(5).toString('hex');
    
    this.tokens.push({ 
      token: code, 
      type: 'confirm' 
    });

    if (this.email) {
      const link = `http://localhost:4200/confirm/${this._id}?code=${code}`;

      mailer.send('user/confirm', this.email, {
        name: this.fullName, 
        link
      });
    }
  }
}

const checkVerification = function (next) {
  if (this.isNew || this.verified) return next();

  // check name
  if (!this.get('name')) return next();
  if (!this.name.first) return next();
  if (!this.name.last) return next();
  if (!this.phone) return next();

  // check address
  if (!this.get('address')) return next();
  if (!this.address.street) return next();
  if (!this.address.city) return next();
  if (!this.address.state) return next();
  if (!this.address.postal) return next();

  // check emergency contact
  if (!this.get('emergency')) return next();
  if (!this.emergency.phone) return next();
  if (!this.get('emergency.name')) return next();
  if (!this.emergency.name.first) return next();
  if (!this.emergency.name.last) return next();

  // verified!
  this.verified = true;
  next();
}

const handleNotices = async function() {
  if (this.isNew && this.status === 'new') {
    await Notice.create({
      notice: 'new',
      item: this._id,
      itemType: 'User'
    });
  }

  if (!this.isNew && this.isModified('status')) {
    if (this._status === 'new' && this.status !== this._status) {
      await Notice.findOneAndRemove({ item: this._id, notice: 'new' });
    }
  }
};

userSchema.pre('save', hashPassword);
userSchema.pre('save', createConfirmationToken);
userSchema.pre('save', checkVerification);
userSchema.pre('save', handleNotices);

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({email}, '+password +tokens');

  if (!user) {
    const err =  new Error('Email not found.');
    err.status = '404';
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    return user;
  } else {
    const err =  new Error('Password is incorrect.');
    err.status = '401';
    throw err;
  }
};

userSchema.statics.refreshToken = async function (client, refresh_token) {
  const decoded = jwt.verify(refresh_token, config.refreshToken.secret);
  if (decoded.client !== client) throw new Error();

  const user = await this.findOne({
    'tokens.client': client, 
    'tokens.token': refresh_token,
    'tokens.type': 'access'
  });
  if (!user) throw new Error();

  const access_token = jwt.sign({
    _id: this._id,
    email: this.email
  }, config.accessToken.secret, {
    expiresIn: config.accessToken.expiresIn
  });

  return access_token;
};

userSchema.statics.removeToken = async function (client, refresh_token) {
  await this.updateOne({
    'tokens.client': client,
    'tokens.token': refresh_token
  }, {
    $pull: { tokens: { client, token: refresh_token } }
  });
};

userSchema.methods.confirmEmail = function (code) {
  const tokens = this.tokens;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toObject();

    if ((token.type === 'confirm') && (token.token === code)) {
      return true;
    }
  }

  const err = new Error('Code invalid');
  err.status = '400';
  throw err;
};

userSchema.methods.verifyPassword = async function (password) {
  const match = await bcrypt.compare(password, this.password);

  if (!match) {
    const err =  new Error('Password is incorrect.');
    err.status = '401';
    throw err;
  }
};

userSchema.methods.generateTokens = async function () {
  const access_token = jwt.sign({
    _id: this._id,
    email: this.email
  }, config.accessToken.secret, {
    expiresIn: config.accessToken.expiresIn
  });

  const client = new mongoose.mongo.ObjectId();

  const refresh_token = jwt.sign({client}, config.refreshToken.secret, {
    expiresIn: config.refreshToken.expiresIn
  });

  this.tokens.push({
    client, 
    token: refresh_token
  });

  while (this.tokens.length > 5) {
    this.tokens.shift();
  }

  await this.save();

  return {access_token, refresh_token, client};
};

userSchema.methods.recoverPassword = async function() {
  const code = crypto.randomBytes(5).toString('hex');
  
  this.tokens.push({ 
    token: code, 
    type: 'confirm' 
  });

  if (this.email) { // send temporary password
    const link = `http://localhost:4200/confirm/${this._id}?code=${code}`;

    mailer.send('user/recover', this.email, {
      name: this.fullName, 
      link
    });
  }
}

userSchema.methods.addTeam = function (team) {
  const user = this;
  
  for (let i = 0; i < user.teams.length; i++) {
    const t = user.teams[i];
    
    if (t._id.equals(team._id)) { user.teams.splice(i, 1); }
  }

  user.teams.push({
    _id: team._id,
    name: team.name
  });
};

userSchema.methods.removeTeam = function (teamId) {
  const user = this;
  
  for (let i = 0; i < user.teams.length; i++) {
    const t = user.teams[i];
    
    if (t._id.equals(teamId)) { user.teams.splice(i, 1); }
  }
};

const User = mongoose.model('User', userSchema);

module.exports = {User};