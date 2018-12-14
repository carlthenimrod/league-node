const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {auth} = require('../middleware/auth');
const {User} = require('../models/user');

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

router.post('/', async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  try {
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const {name} = req.body;
    const user = await User.findByIdAndUpdate(id, {
      name
    }, {
      new: true
    });
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
    await User.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/me', auth, (req, res) => {
  res.send(req.user);
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const tokens = await user.generateTokens();

    res.send({
      _id: user._id,
      email: user.email,
      ...tokens
    });
  } catch (e) {
    switch (e.message) {
      case 'User not found.':
        res.status(404).send();
        break;
      case 'Password incorrect.':
        res.status(401).send();
        break;
      default:
        res.status(400).send(e);
    }
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const access_token = await User.refreshToken(req.body.client, req.body.refresh_token);
    res.send({access_token});
  } catch (e) {
    res.status(401).send();
  }
});

router.delete('/logout', async (req, res) => {
  try {
    await User.removeToken(req.body.client, req.body.refresh_token);
    res.send();
  } catch (e) {
    res.status(400).send();
  }
});

module.exports = router;