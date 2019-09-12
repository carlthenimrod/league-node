const {ObjectID} = require('mongodb');

const userStore = require('../stores/user-store');
const teamStore = require('../stores/team-store');

class SocketHandler {
  constructor(connection) {
    this.io = connection.io;
    this.socket = connection.socket;
    this.user = connection.user;

    this.connect();
    this.handle();
  }

  connect() {
    userStore.add(this.user, this.socket.id);
  }

  handle() {
    this.socket.on('disconnect', this.disconnect.bind(this));
    this.socket.on('join', this.join.bind(this));
    this.socket.on('leave', this.leave.bind(this));
    this.socket.on('feed', this.feed.bind(this));
    this.socket.on('typing', this.typing.bind(this));
  }

  disconnect() {
    userStore.remove(this.user, this.socket.id);
  }

  addSocket(user) {
    try {
      // if no sockets, create array with socket.id
      if (!user.sockets) { 
        user.sockets = [this.socket.id];
        this.setOnline(true);
      } else { // push to existing sockets array if not already included
        if (user.sockets.includes(this.socket.id)) { return; }
        user.sockets.push(this.socket.id);
      }
    } catch (e) {
      console.log(e.toString());
    }
  }

  removeSocket(user) {
    // check user for socket id
    const index = user.sockets.indexOf(this.socket.id);
  
    if (index >= 0) {
      user.sockets.splice(index, 1);
  
      // if no more sockets, remove user from store
      if (user.sockets.length === 0) {
        userStore.remove(this.userId);
  
        // offline
        this.setOnline(false);
      }
    }
  }

  async setOnline(online) {
    const teams = await teamStore.get();
  
    teams.forEach(team => {
      // search teams for user, update their online status
      for (let i = 0; i < team.roster.length; i++) {
        const user = team.roster[i];
        
        if (user._id.equals(this.userId)) {
          team.roster[i].status.online = (online) ? true : false;
    
          // send updated user
          this.io.to(team._id).emit('team', {
            event: 'roster',
            data: {
              action: 'update',
              users: [team.roster[i]]
            }
          });
        }
      }
    });
  }

  async join(teamId) {
    try {
      if (!teamId || !ObjectID.isValid(teamId)) {
        throw new Error('Invalid ID');
      }

      // get team, check if user is part of team, add to store if not found
      const team = await teamStore.get(teamId, this.userId, true);

      // get all users from userStore
      const users = await userStore.get();

      // check if rostered player is in userStore, set to online if found
      for (let i = 0; i < team.roster.length; i++) {
        const user = team.roster[i];

        const match = users.find(u => u._id.equals(user._id));

        user.status.online = (match) ? true : false;
      }
      
      // join room
      this.socket.join(teamId);

      // emit roster to team
      this.io.to(teamId).emit('team', {
        event: 'roster',
        data: {
          action: 'update',
          users: team.roster
        }
      });
    } catch (e) {
      console.log(e.toString());
    }
  }

  leave(teamId) {
    try {
      if (!teamId || !ObjectID.isValid(teamId)) {
        throw new Error('Invalid ID');
      }
      
      this.socket.leave(teamId);
    } catch (e) {
      console.log(e.toString());
    }
  }

  feed(data) {
    try {
      const {teamId, action, message} = data;

      if (!teamId || !ObjectID.isValid(teamId)) {
        throw new Error('Invalid ID');
      }

      this.socket.to(teamId).broadcast.emit('team', {
        event: 'feed',
        data: {
          action,
          message
        }
      });
    } catch (e) {
      console.log(e.toString());
    }
  }

  async typing(data) {
    try {
      const {teamId, isTyping} = data;

      if (!teamId || !ObjectID.isValid(teamId)) {
        throw new Error('Invalid ID');
      }

      const team = await teamStore.get(teamId);
      const user = await userStore.get(this.userId);

      // add / remove to team store
      if (isTyping) {
        const match = team.typing.find(u => u._id.equals(this.userId));
        if (!match) {
          const {_id, name, fullName} = user;
          team.typing.push({_id, name, fullName});
        }
      } else {
        const index = team.typing.findIndex(u => u._id.equals(user._id));
        team.typing.splice(index, 1);
      }

      // broadcast to other team members
      this.socket.to(teamId).broadcast.emit('team', {
        event: 'typing',
        data: { users: team.typing }
      });
    } catch (e) {
      console.log(e.toString());
    }
  }
}

const updateUser = updatedUser => {
  userStore.update(io, updatedUser);
  teamStore.updateUser(io, updatedUser);
};

module.exports = SocketHandler;