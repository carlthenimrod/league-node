const mongoose = require('mongoose');
const EventEmitter = require('events');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const notificationSchema = new Schema({
  type: { type: String, required: true },
  action: { type: String, required: true },
  status: {
    read: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

const notificationEvent = new EventEmitter();

const Notification = mongoose.model('Notification', notificationSchema);

const adminNotificationSchema = new Schema({
  type: { type: String, default: 'admin' }
});

const AdminUserNotification = Notification.discriminator(
  'AdminUserNotification', 
  new Schema({
    user: { ref: 'User', type: ObjectId }
  })
  .add(adminNotificationSchema)
);

const AdminTeamNotification = Notification.discriminator(
  'AdminTeamNotification', 
  new Schema({
    team: { ref: 'Team', type: ObjectId }
  })
  .add(adminNotificationSchema)
);

const TeamInviteNotification = Notification.discriminator(
  'TeamInviteNotification',
  new Schema({
    type: { type: String, default: 'team' },
    action: { type: String, default: 'invite' },
    team: { ref: 'Team', type: ObjectId },
    status: {
      pending: { type: Boolean, default: true },
      accepted: { type: Boolean, default: false }
    }
  })
  .pre('save', function(next) {
    if (this.isNew || !this.isModified()) { return next(); }
    if (this.status.pending) { return next(); }

    if (this.status.accepted) {
      const teams = this.parent().teams;
      if (teams.includes(this.team)) { return next(); }
      teams.push(this.team);
      notificationEvent.emit('teamInvite',
        this.team.toString(),
        this.parent()._id.toString(),
        true
      );
    } else {
      notificationEvent.emit('teamInvite',
        this.team.toString(),
        this.parent()._id.toString(),
        false
      );
    }



    next();
  })
)

module.exports = {
  Notification,
  AdminUserNotification,
  AdminTeamNotification,
  TeamInviteNotification,
  notificationEvent
};