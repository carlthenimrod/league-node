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
    password, 
    address, 
    phone, 
    secondary, 
    emergency, 
    comments } = req.body;

  const user = new User({
    name,
    email,
    password,
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
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const {name, status} = req.body;

    const user = await User.findById(id);
    user.name = name;
    user.status = status;
    await user.save();

    res.send(user);
  } catch (e) {
    res.status(400).send(e);
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
      const tokens = await user.generateTokens();
      
      res.send({
        _id: user._id,
        email: user.email,
        ...tokens
      });
    }

    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;