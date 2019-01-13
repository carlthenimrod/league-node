const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {User} = require('../models/user');
const {Team} = require('../models/team');

router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const user = await User.findById(id);
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/', async (req, res, next) => {
  const {
    name, 
    email, 
    address, 
    phone, 
    secondary, 
    emergency, 
    comments } = req.body;

  const user = new User({
    name,
    email,
    address, 
    phone, 
    secondary, 
    emergency, 
    comments
  });

  try {
    await user.save();
    res.send(user);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const {
    name, 
    password, 
    address, 
    phone, 
    secondary, 
    emergency, 
    comments } = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    const user = await User.findByIdAndUpdate(id, {
      name, 
      password, 
      address, 
      phone, 
      secondary, 
      emergency, 
      comments 
    }, { new: true });

    res.send(user);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    // remove user from any teams they are on
    await Team.updateMany(
      { 'roster.user': id }, 
      { $pull: { roster: { user: id } } }
    );

    // delete user
    await User.findByIdAndDelete(id);

    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/confirm', async (req, res, next) => {
  const id = req.params.id;
  const code = req.body.code;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id, '+tokens');

    if (!user) {
      const err = new Error('User not found.');
      err.status = '404';
      throw err;
    };

    if (user.confirmEmail(code)) { res.send(); } 
  } catch (e) {
    next(e);
  }
});

router.post('/:id/password', async (req, res, next) => {
  const id = req.params.id;
  const {code, password} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id, '+tokens');

    if (!user) {
      const err = new Error('User not found.');
      err.status = '404';
      throw err;
    };

    if (user.confirmEmail(code)) {
      user.password = password;
      user.tokens = [];
      const tokens = await user.generateTokens();
      
      res.send({
        _id: user._id,
        email: user.email,
        ...tokens
      });
    }
  } catch (e) {
    next(e);
  }
});

router.put('/:id/password', async (req, res, next) => {
  const id = req.params.id;
  const {old, password} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id, '+password');

    if (!user) {
      const err = new Error('User not found.');
      err.status = '404';
      throw err;
    };

    await user.verifyPassword(old);
    user.password = password;
    await user.save();

    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/email', async (req, res, next) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({email});

    if (user) {
      const err = new Error('Email Taken.');
      err.status = 409;
      throw err;
    } 
    
    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;