const router = require('express').Router();

const {User} = require('../models/user');

router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
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

router.post('/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email, 
      req.body.password
    );
    res.send(user);
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

module.exports = router;