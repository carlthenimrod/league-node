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
        .populate('roster.user', 'name email friends');

      if (!team) throw new Error('No team found');

      team = team.toObject();

      // check if on roster
      if (!onRoster(socket, team.roster)) throw new Error('Not on team');

      // get roster status
      getRosterStatus(team.roster);

      // add team to store
      teams.push(team);
    }
    
    // join room
    socket.join(teamId);

    // send roster
    io.to(teamId).emit('team', {
      action: 'roster',
      roster: team.roster
    });
  } catch (e) {
    console.log(e.message);
  }
};

const leave = (io, socket, teamId) => {
  socket.leave(teamId);
};

const onRoster = (socket, roster) => {
  const _id = socket.handshake.query._id;

  for (let i = 0; i < roster.length; i++) {
    const user = roster[i].user;
    
    if (user._id.equals(_id)) { return true; }
  }

  return false;
};

const getRosterStatus = (roster) => {
  for (let i = 0; i < roster.length; i++) {
    const user = roster[i].user;

    roster[i].status = userStore.getStatus(user._id);
  }
};

const updateUserStatus = (userId, status) => {
  teams.forEach((team, index) => {
    let match = false;

    // search teams for user, update their status
    for (let i = 0; i < team.roster.length; i++) {
      const user = team.roster[i].user;
      
      if (user._id.equals(userId)) {
        team.roster[i].status = status;
        match = true;
      }
    }

    // if no users online, remove team from store
    if (match && (status === 'offline')) {
      const online = team.roster.filter(u => u.status !== 'offline');

      if (online.length === 0) teams.splice(index, 1);
    }
  });
};

module.exports = {join, leave, updateUserStatus};