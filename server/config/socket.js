const jwt = require('jsonwebtoken');

const config = require('./config');
const userStore = require('../stores/user-store');
const teamStore = require('../stores/team-store');

let io;

const init = server => {
  io = require('socket.io')(server);

  io.use(authorize);
  io.use(userStore.add);

  io.on('connection', socket => {
    socket.on('disconnect', () => {
      const _id = socket.handshake.query._id;

      // remove socket from user
      userStore.remove(socket);

      // get status
      const status = userStore.getStatus(_id);

      // if user went offline, change status for teams
      if (status === 'offline') teamStore.updateUserStatus(_id, status);
    });

    socket.on('join', teamId => {
      teamStore.join(io, socket, teamId);
    });

    socket.on('leave', teamId => {
      teamStore.leave(io, socket, teamId);
    });
  });

  return io;
};

const authorize = (socket, next) => {
  const {access_token, refresh_token, _id } = socket.handshake.query;

  if (!access_token || !refresh_token || !_id) {
    return next(new Error('Unable to authenticate - Missing data'));
  }

  const decoded = jwt.decode(access_token, config.accessToken.secret);

  if (decoded._id !== _id) { 
    return next(new Error('Unable to authenticate - ID invalid'));
  }
  
  jwt.verify(refresh_token, config.refreshToken.secret, (err, decoded) => {
    if (err) { 
      return next(new Error('Unable to authenticate - Token Invalid'));
    }

    return next();
  });
};

const get = () => {
  if (!io) {
    throw new Error('No connection to socket');
  }
  return io;
};

module.exports = {init, get};