const router = require('express').Router();

const {auth} = require('../middleware/auth');
const {User} = require('../models/user');

router.get('/me', auth, (req, res) => {
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
      ...tokens
    });
  } catch (e) {
    next(e);
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
    next(e);
  }
});

module.exports = router;