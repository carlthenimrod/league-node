const users = [];

const add = (user, socketId) => {
  const match = users.find(u => u._id.equals(user._id));
  
  if (match) {
    match.sockets.push(socketId);
  } else {
    users.push({
      _id: user._id,
      email: user.email,
      name: user.name,
      fullName: user.fullName,
      status: [user.status],
      sockets: [socketId]
    });
  }
};

const remove = (user, socketId) => {
  const index = users.findIndex(u => u._id.equals(user._id))
  const match = users[index];

  match.sockets.splice(match.sockets.indexOf(socketId), 1);
  if (match.sockets.length === 0) { users.splice(index, 1); }
};

const get = value => {
  if (!value) { return users; }

  if (value.constructor === Array) {
    const match = users.filter(u => 
      value.includes(u._id.toString())
    );

    return match;
  } else {
    const match = users.find(u => u._id.equals(value));
    
    return match ? match : false;
  }
}

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
  add,
  remove,
  get,
  update,
  isOnline, 
  getUserFromSocket
};