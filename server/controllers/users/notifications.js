const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {User} = require('../../models/user');

router.get('/', async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }
    
    const user = await User.findById(id, 'notifications')
      .populate('notifications.team', 'name img')
      .populate('notifications.user', 'name fullName img');

    res.send(user.notifications);
  } catch (e) {
    next(e);
  }
});

router.put('/:notificationId', async (req, res, next) => {
  const {id, notificationId} = req.params;
  const {status} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(notificationId)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }

    const user = await User.findById(id, 'teams notifications');
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    const index = user.notifications
      .findIndex(n => n._id.toString() === notificationId);

    const notification = user.notifications[index];
    notification.status = { ...notification.status, ...status};

    await user.save();

    if (notification.team) {
      await user.populate(`notifications.${index}.team`, 'name img').execPopulate();
    }

    res.send(notification);
  } catch (e) {
    next(e);
  }
});

router.post('/read', async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }
    
    const user = await User.findById(id, 'notifications')
      .populate('notifications.team', 'name img')
      .populate('notifications.user', 'name fullName img');

    for (let i = 0; i < user.notifications.length; i++) {
      const notification = user.notifications[i];
      
      notification.status.read = true;
    }

    await user.save();

    res.send(user.notifications);
  } catch (e) {
    next(e);
  }
})

module.exports = router;