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
  recovery: {type: String, select: false},
  status: {
    type: String,
    enum: ['new', 'active', 'inactive', 'banned'],
    default: 'new',
    set: function(status) {
      this._status = this.status;
      return status;
    }
  },
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
      first: {type: String, trim: true, required: true},
      last: {type: String, trim: true, required: true}
    },
    phone: {type: String, trim: true},
    secondary: {type: String, trim: true}
  },
  comments: {type: String, trim: true}
}, { 
  toJSON: {
    virtuals: true
  } 
});

userSchema.virtual('fullName').get(function() {
  return getFullName(this.name);
});

userSchema.virtual('emergency.fullName').get(function() {
  return getFullName(this.emergency.name);
});

var getFullName = function(name) {
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

var createRecoveryPassword = async function () {
  if (this.isNew && !this.password) {
    // create code
    const code = crypto.randomBytes(5).toString('hex');
    
    // add to tokens
    this.tokens.push({ 
      token: code, 
      type: 'confirm' 
    });

    if (this.email) { // send temporary password
      const link = `http://localhost:4200/register/${this._id}?code=${code}`;

      mailer.send('user/confirm', this.email, {
        name: this.fullName, 
        link
      });
    }
  }
}

userSchema.pre('save', createRecoveryPassword);

userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 10, (err, hash) => {
      this.password = hash;
      next();
    });
  } else {
    next();
  }
});

userSchema.pre('save', async function () {
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
});

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
  const user = await this.findOne({
    'tokens.client': client,
    'tokens.token': refresh_token
  });

  if (!user) return;

  // user.tokens.id(client).remove();
  // await user.save();
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

  // only keep 5 latest tokens
  while (this.tokens.length > 5) {
    this.tokens.shift();
  }

  await this.save();

  return {access_token, refresh_token, client};
};

const User = mongoose.model('User', userSchema);

module.exports = {User};