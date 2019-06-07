const {Team} = require('../models/team');
const userStore = require('./user-store');

const teams = [];

const join = async (io, socket, teamId) => {
  try {
    let team = teams.find(t => t._id.equals(teamId));

    // if no team, reach out to DB
    if (!team) { 
      team = await Team
        .findById(teamId, 'name roster')
        .populate('roster.user', 'name email friends status');

      if (!team) throw new Error('No team found');

      team = Team.formatRoster(team);
      team.typing = [];

      // check if on roster
      if (!onRoster(socket, team.roster)) throw new Error('Not on team');

      // update roster status
      updateRosterStatus(team.roster);

      // add team to store
      teams.push(team);
    } else {
      // update roster status
      updateRosterStatus(team.roster);
    }
    
    // join room
    socket.join(teamId);

    // send roster
    io.to(teamId).emit('team', {
      event: 'roster',
      data: {
        action: 'update',
        users: team.roster
      }
    });
  } catch (e) {
    console.log(e.message);
  }
};

const leave = (socket, teamId) => {
  socket.leave(teamId);
};

const onRoster = (socket, roster) => {
  const _id = socket.handshake.query._id;

  for (let i = 0; i < roster.length; i++) {
    const user = roster[i];
    
    if (user._id.equals(_id)) { return true; }
  }

  return false;
};

const updateRosterStatus = (roster) => {
  for (let i = 0; i < roster.length; i++) {
    const user = roster[i];

    roster[i].status.online = userStore.isOnline(user._id);
  }
};

const updateUser = (io, updatedUser) => {
  teams.forEach(team => {
    for (let i = 0; i < team.roster.length; i++) {
      const user = team.roster[i];

      if (user._id.equals(updatedUser._id)) {
        const {name, fullName, email} = updatedUser;
        user.name = name;
        user.fullName = fullName;
        user.email = email;

        // send updated user
        io.to(team._id).emit('team', {
          event: 'roster',
          data: {
            action: 'update',
            users: [user]
          }
        });
      }
    }
  });
};

const updateUserStatus = (io, userId, online) => {
  teams.forEach(team => {
    let match = false;

    // search teams for user, update their online status
    for (let i = 0; i < team.roster.length; i++) {
      const user = team.roster[i];
      
      if (user._id.equals(userId)) {
        team.roster[i].status.online = online;
        match = true;

        // send updated user
        io.to(team._id).emit('team', {
          event: 'roster',
          data: {
            action: 'update',
            users: [team.roster[i]]
          }
        });
      }
    }

    // if no users online, remove team from store
    if (match && !online) {
      const index = team.typing.findIndex(u => u._id.equals(userId));
      if (index > -1) { team.typing.splice(index, 1); }

      const online = team.roster.filter(u => u.status.online);

      if (online.length === 0) teams.splice(index, 1);
    }
  });
};

const feed = (socket, data) => {
  const {teamId, action, message} = data;

  socket.to(teamId).broadcast.emit('team', {
    event: 'feed',
    data: {
      action,
      message
    }
  });
};

const typing = (socket, data) => {
  const {teamId, isTyping} = data;

  try {
    const team = teams.find(t => t._id.equals(teamId));

    if (!team) {
      const err = new Error('No team found.');
      throw err;
    }

    const user = userStore.getUserFromSocket(socket.id);
    
    if (!user) {
      const err = new Error('No user found.');
      throw err;
    }

    // add/remove to team store
    if (isTyping) {
      const match = team.typing.find(u => u._id.equals(user._id));
      if (!match) {
        const {_id, name, fullName} = user;
        team.typing.push({_id, name, fullName});
      }
    } else {
      const index = team.typing.findIndex(u => u._id.equals(user._id));
      team.typing.splice(index, 1);
    }

    // broadcast to other team members
    socket.to(teamId).broadcast.emit('team', {
      event: 'typing',
      data: { users: team.typing }
    });
  } catch (e) {
    console.log(e.message);
  }
};

module.exports = {join, leave, updateUser, updateUserStatus, feed, typing};