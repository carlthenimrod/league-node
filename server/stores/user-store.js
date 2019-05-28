const {User} = require('../models/user');

const users = [];

const add = async (socket, next) => {
  const _id = socket.handshake.query._id;

  try {
    const match = users.find(u => u._id.equals(_id));

    // if user already in store, add new connection
    if (match) { 
      match.sockets.push(socket.id);
      return next();
    }

    // new user, add to store
    const user = await User.findById(_id, 'name email friends');

    // check friends
    user.friends = filterFriends(user.friends);

    users.push({
      _id: user._id,
      name: user.fullName,
      email: user.email,
      sockets: [socket.id],
      friends: user.friends
    });
  } catch (e) {
    return next(e);
  }

  return next();
};

const remove = socket => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    // check all users for socket id
    const index = user.sockets.indexOf(socket.id);

    if (index >= 0) {
      user.sockets.splice(index, 1);

      // if no more sockets, remove user from store
      if (user.sockets.length === 0) {
        users.splice(i, 1);
      }
    }
  }
};

const filterFriends = friends => {
  if (!friends) { return; } // :(

  for (let i = 0; i < friends.length; i++) {
    const friend = friends[i];
  }

  return friends;
};

const getStatus = _id => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    if (user._id.equals(_id)) { return true; }
  }

  return false;
};

module.exports = {add, remove, getStatus};