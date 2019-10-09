const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {Team} = require('../../models/team');
const {User} = require('../../models/user');

router.post('/', async (req, res, next) => {
  const id = req.params.id;
  const {
    userId,
    name,
    roles
  } = req.body;
  let user;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    // check if user exists already
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
      }
    } else { // create new
      user = new User({ name });
    }

    const team = await Team.findById(id).populate('roster.user');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }

    // remove user if exists already
    if (userId) { 
      for (let i = 0; i < team.roster.length; i++) {5
        const u = team.roster[i].user;

        if (u._id.equals(ObjectID(user._id))) { 
          team.roster.splice(i, 1); 
        }
      }
    }

    user.teams.push(id);
    await user.save();

    team.roster.push({user, roles});
    await team.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.put('/:userId', async (req, res, next) => {
  const {id, userId} = req.params;
  const {roles} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(userId)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    // find team
    const team = await Team.findById(id).populate('roster.user');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }
    
    for (let i = 0; i < team.roster.length; i++) {
      const u = team.roster[i].user;

      if (u._id.equals(ObjectID(userId))) {
        team.roster[i].roles = roles;
      }
    }

    await team.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.delete('/:userId', async (req, res, next) => {
  const {id, userId} = req.params;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(userId)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    const team = await Team.findById(id).populate('roster.user');
    if (!team) {
      const err = new Error('Team not found.');
      err.status = 404;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    
    for (let i = 0; i < team.roster.length; i++) {5
      const u = team.roster[i].user;

      if (u._id.equals(ObjectID(userId))) {
        team.roster.splice(i, 1);
      }
    }

    user.teams.pull(id);
    await user.save();

    await team.save();

    res.send(team);
  } catch (e) {
    next(e);
  }
});

module.exports = router;