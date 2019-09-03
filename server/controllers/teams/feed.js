const router = require('express').Router({ mergeParams: true });
const {ObjectID} = require('mongodb');

const {Team} = require('../../models/team');

router.post('/', async (req, res, next) => {
  const id = req.params.id;
  const {type, body} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const team = await Team.findById(id);

    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    const message = team.feed.create({
      type, 
      body, 
      from: req.user._id
    });
    team.feed.push(message);
    await team.save();
    await team.populate('feed.from', 'name email img roles').execPopulate();

    res.send(message);
  } catch (e) {
    next(e);
  }
});

router.put('/:messageId', async (req, res, next) => {
  const {id, messageId} = req.params;
  const {body} = req.body;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(messageId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const team = await Team.findById(id);

    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    const message = team.feed.id(messageId);
    message.body = body;
    await team.save();
    await team.populate('feed.from', 'name email img roles').execPopulate();
    res.send(message);
  } catch (e) {
    next(e);
  }
});

router.delete('/:messageId', async (req, res, next) => {
  const {id, messageId} = req.params;

  try {
    if (!ObjectID.isValid(id) || !ObjectID.isValid(messageId)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    const team = await Team.findById(id);

    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    team.feed.id(messageId).remove();
    team.save();
    res.send();
  } catch (e) {
    next(e);
  }
});


module.exports = router;