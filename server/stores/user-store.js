const {User} = require('../models/user');

const users = [];

const get = async (userId, create) => {
  try {
    if (!userId) { return users; }
  
    user = users.find(u => u._id.equals(userId));
  
    if (!user && create) {
      user = await insert(userId);
    }
  
    if (!user) throw new Error('No User Found');
  
    return user;
  } catch (e) {
    throw e;
  }
}

const insert = async userId => {
  let user;

  try {
    user = await User.findById(userId, 'name email friends');
  
    if (!user) throw new Error('No User Found in Database');
  
    user = user.toObject();

    // check friends
    user.friends = filterFriends(user.friends);
  
    // add to store
    users.push(user);

    return user;
  } catch (e) {
    throw e;
  }
};

const remove = userId => {
  const index = users.findIndex(user => user._id.equals(userId));

  users.splice(index, 1);
};

const update = (io, updatedUser) => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    if (user._id.equals(updatedUser._id)) {
      const {name, email, fullName} = updatedUser;

      user.name = name;
      user.email = email;
      user.fullName = fullName;
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

const isOnline = _id => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    if (user._id.equals(_id)) { return true; }
  }

  return false;
};

const getUserFromSocket = socketId => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    if (user.sockets.includes(socketId)) { return user; }
  }

  return false;
};

module.exports = {
  get,
  remove, 
  update,
  isOnline, 
  getUserFromSocket
};