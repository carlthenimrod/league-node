const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {Team} = require('../../models/team');

router.post('/', async (req, res, next) => {
  const id = req.params.id;
  const userId = req.body._id;
  let user;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }

    const team = await Team.findById(id);
    if (!team.pending) { team.pending = []; }

    if (team.pending.indexOf(userId) !== -1) {
      const err = new Error('User already invited');
      err.status = 400;
      throw err;
    }
    
    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    if (userId) {
      if (!ObjectID.isValid(userId)) {
        const err = new Error('Invalid ID');
        err.status = 400;
        throw err;
      }

      user = await User.findById(userId, '+notifications');
      user.notifications.push({
        type: 'invite',
        action: 'request',
        status: { pending: true },
        team: id
      });
      await user.save();
    
      if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      team.pending.push(userId);
      await team.save();
    } else {
      const {email, name} = req.body;

      user = new User({ email, name });
      user.notifications = [{
        type: 'invite',
        action: 'request',
        status: { pending: true },
        team: id
      }];
      await user.save();

      team.pending.push(user._id);
      await team.save();
    }

    delete user.notifications;
    res.send(user);
  } catch (e) {
    next(e);
  }
});

router.post('/accept', async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }

    const team = await Team.findById(id, 'name pending');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }

    // find user in pending
    const index = team.pending.indexOf(user._id);
    if (index === -1) {
      const err = new Error('Not invited.');
      err.status = 409;
      throw err;
    }

    // remove user from pending
    team.pending.splice(index, 1);

    // add user to roster
    team.roster.push({
      user: user._id,
      roles: ['player']
    });

    await team.save();

    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/decline', async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 400;
      throw err;
    }
    
    const team = await Team.findById(id, 'name pending');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }

    // find user in pending
    const index = team.pending.indexOf(user._id);
    if (index === -1) {
      const err = new Error('Not invited.');
      err.status = 409;
      throw err;
    }

    // remove user from pending
    team.pending.splice(index, 1);

    res.send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;