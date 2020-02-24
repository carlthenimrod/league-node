const {User, userEvent} = require('../models/user');
const {teamEvent} = require('../models/team');
const userStore = require('../stores/user-store');
const {
  AdminUserNotification,
  AdminTeamNotification,
  TeamInviteNotification
} = require('../models/notification');

const notificationHandler = io => {
  const newUser = user => {
    const notification = new AdminUserNotification({
      action: 'newUser',
      user: user._id
    });

    notifyAdmins(notification);
  };

  const newTeam = team => {
    sendInvites(team);

    const notification = new AdminTeamNotification({
      action: 'newTeam',
      team
    });

    notifyAdmins(notification);
  };

  const sendInvites = team => {
    if (team.pending.length === 0) { return; }

    team.pending.forEach(p => invite(p.user, team));
  };

  const invite = async (id, team) => {
    const user = await User.findById(id, 'notifications');

    const notification = new TeamInviteNotification({
      team
    });

    user.notifications.push(notification);
    await user.save();

    const match = userStore.get(user._id);
    if (match) {
      match.sockets.forEach(socketId => {
        io.to(socketId).emit('notification', notification); 
      })
    }
  };

  const notifyAdmins = async notification => {
    const admins = await User.admins('notifications');
    if (admins.length === 0) { return; }

    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];
      admin.notifications.push(notification);

      await admin.save();
    }

    const users = userStore.get(
      admins.map(a => a._id.toString())
    );

    if (users.length === 0) { return; }
    users.forEach(user => 
      user.sockets.forEach(socketId => {
        io.to(socketId).emit('notification', notification)
      })
    );
  };

  userEvent.on('new', newUser);
  teamEvent.on('new', newTeam);
};

module.exports = notificationHandler;