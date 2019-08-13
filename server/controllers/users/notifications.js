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