const jwt = require('jsonwebtoken');
const config = require('../config/config');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').split(' ')[1];
    const user = jwt.verify(token, config.accessToken.secret);
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send(e);
  }
};

module.exports = {auth};