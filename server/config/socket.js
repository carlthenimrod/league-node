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
    const userId = socket.handshake.query._id;

    // set status to online
    teamStore.updateUserStatus(io, userId, true);

    // bind events
    socket.on('disconnect', disconnect.bind(socket, userId));
    socket.on('join', join.bind(socket));
    socket.on('leave', leave.bind(socket));
    socket.on('feed', feed.bind(socket));
    socket.on('typing', typing.bind(socket));
  });

  return io;
};

const disconnect = function(userId) {
  // remove socket from user
  userStore.remove(this);

  // check if online
  const online = userStore.isOnline(userId);

  // if user went offline(no sockets), change to offline
  if (!online) teamStore.updateUserStatus(io, userId, online);
};

const join = function(teamId) {
  teamStore.join(io, this, teamId);
}

const leave = function(teamId) {
  teamStore.leave(this, teamId);
}

const authorize = (socket, next) => {
  const {access_token, refresh_token, _id } = socket.handshake.query;

  if (!access_token || !refresh_token || !_id) {
    return next(new Error('Unable to authenticate - Missing data'));
  }

  const decoded = jwt.decode(access_token, config.accessToken.secret);

  if (!decoded || (decoded._id !== _id)) { 
    return next(new Error('Unable to authenticate - ID invalid'));
  }
  
  jwt.verify(refresh_token, config.refreshToken.secret, (err, decoded) => {
    if (err) { 
      return next(new Error('Unable to authenticate - Token Invalid'));
    }

    return next();
  });
};

const feed = function(data) {
  teamStore.feed(this, data);
};

const typing = function(data) {
  teamStore.typing(this, data);
};

const get = () => {
  if (!io) throw new Error('No connection to socket');
  
  return io;
};

module.exports = {init, get};