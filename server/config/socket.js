const SocketHandler = require('../helpers/socket-handler');
const {User} = require('../models/user');

let io;

const init = server => {
  io = require('socket.io')(server, { pingTimeout: 30000 });
  io.on('connection', connect);
  SocketHandler.io = io;

  return io;
};

const authorize = async (client, refresh_token) => {
  try {
    const { user, access_token } = await User.refreshToken(client, refresh_token);
    
    return { user, access_token };
  } catch (e) {
    throw e;
  }
};

const connect = socket => {
  const timeout = setTimeout(() => {
    socket.disconnect('Unauthorized');
  }, 5000);

  socket.on('authorize', async data => {
    const { client, refresh_token } = data;

    try {
      const { user, access_token } = await authorize(client, refresh_token);
      clearTimeout(timeout);

      socket.emit('authorized', {
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
      
      new SocketHandler({ socket, user });
    } catch (e) {
      console.log(e.message);
      socket.disconnect('Unauthorized');
    }
  });
}

module.exports = init;