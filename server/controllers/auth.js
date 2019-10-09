const router = require('express').Router();

const {loggedIn} = require('../middleware/auth');
const {User} = require('../models/user');

router.get('/me', loggedIn, (req, res) => {
  res.send(req.user);
});

router.post('/login', async (req, res, next) => {
  const {email, password} = req.body;

  try {
    const user = await User.findByCredentials(email, password);
    const tokens = await user.generateTokens();

    res.send({
      _id: user._id,
      email: user.email,
      name: user.name,
      fullName: user.fullName,
      status: user.status,
      img: user.img,
      teams: user.teams,
      ...tokens
    });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  const {client, refresh_token} = req.body;

  try {
    const {user, access_token} = await User.refreshToken(client, refresh_token);
    res.send({
      _id: user._id,
      email: user.email,
      name: user.name,
      fullName: user.fullName,
      status: user.status,
      img: user.img,
      teams: user.teams,
      client,
      access_token,
      refresh_token
    });
  } catch (e) {
    next(e);
  }
});

router.delete('/logout', async (req, res, next) => {
  const {client, refresh_token} = req.body;

  try {
    await User.removeToken(client, refresh_token);
    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;