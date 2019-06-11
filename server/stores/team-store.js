const {Team} = require('../models/team');

const teams = [];

const get = async (teamId, userId, create) => {
  let team;

  try {
    if (!teamId) { return teams; }

    team = teams.find(t => t._id.equals(teamId));
    if (team) { 
      if (userId && !isOnTeam(team, userId)) throw new Error('Not on Team.');
    } else if (!team && create) {
      team = await insert(teamId, userId); 
    }

    return team;
  } catch (e) {
    throw e;
  }
};

const insert = async (teamId, userId) => {
  let team;

  try {
    team = await Team
      .findById(teamId, 'name roster')
      .populate('roster.user', 'name email friends status');
    
    if (!team) throw new Error('No Team Found');
  
    team = Team.formatRoster(team);
    team.typing = [];

    if (userId && !isOnTeam(team, userId)) throw new Error('Not on Team.');

    teams.push(team);

    return team;
  } catch (e) {
    throw e;
  }
};

const isOnTeam = (team, userId) => {
  for (let i = 0; i < team.roster.length; i++) {
    const user = team.roster[i];

    if (user._id.equals(userId)) { return true; }
  }

  return false;
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

module.exports = {get, updateUser, updateUserStatus, typing};