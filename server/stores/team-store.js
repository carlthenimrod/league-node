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
        .populate('roster.user', 'friends status');

      if (!team) throw new Error('No team found');

      team = Team.formatRoster(team);

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

    roster[i].status.online = userStore.getStatus(user._id);
  }
};

const updateUserStatus = (io, userId, status) => {
  teams.forEach((team, index) => {
    let match = false;

    // search teams for user, update their status
    for (let i = 0; i < team.roster.length; i++) {
      const user = team.roster[i];
      
      if (user._id.equals(userId)) {
        team.roster[i].status = status;
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
    if (match && (status === 'offline')) {
      const online = team.roster.filter(u => u.status.online);

      if (online.length === 0) teams.splice(index, 1);
    }
  });
};

module.exports = {join, leave, updateUserStatus};