const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifyToken = (req) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      const err = new Error('No authorization header provided.');
      err.status = 401;
      throw err;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      const err = new Error('No token provided.');
      err.status = 401;
      throw err;
    }

    jwt.verify(token, config.accessToken.secret, (err, user) => {
      if (err) {
        err.message = 'Token invalid.';
        err.status = 401;
        throw err;
      }

      req.user = user;
    });
  } catch (e) {
    throw e;
  }
};

const loggedIn = async (req, res, next) => {
  try {
    verifyToken(req);
    next();
  } catch (e) {
    next(e);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    verifyToken(req);

    if (!req.user.status || !req.user.status.admin) {
      const err = new Error('User is not authorized.');
      err.status = 401;
      throw err;
    }

    next();
  } catch (e) {
    next(e);
  }
}

module.exports = {loggedIn, isAdmin};