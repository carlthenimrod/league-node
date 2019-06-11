const jwt = require('jsonwebtoken');
const {ObjectID} = require('mongodb');

const config = require('./config');
const SocketHandler = require('../helpers/socket-handler');

let io;

const init = server => {
  io = require('socket.io')(server);

  io.use(authorize);
  io.on('connection', createHandler);

  return io;
};

const authorize = (socket, next) => {
  const {access_token, refresh_token, _id } = socket.handshake.query;

  try {
    if (!_id || !ObjectID.isValid(_id)) {
      throw new Error('Invalid ID');
    }
  
    if (!access_token || !refresh_token || !_id) {
      throw new Error('Unable to authenticate - Missing data');
    }
  
    const decoded = jwt.decode(access_token, config.accessToken.secret);
  
    if (!decoded || (decoded._id !== _id)) { 
      throw new Error('Unable to authenticate - ID invalid');
    }
    
    jwt.verify(refresh_token, config.refreshToken.secret, (err, decoded) => {
      if (err) { 
        throw new Error('Unable to authenticate - Token Invalid');
      }
  
      return next();
    });
  } catch (e) {
    next(e);
  }
};

const createHandler = socket => {
  const userId = socket.handshake.query._id;

  new SocketHandler({ io, socket, userId });
}

module.exports = init;