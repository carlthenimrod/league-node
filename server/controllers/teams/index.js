const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {loggedIn, isAdmin} = require('../../middleware/auth');
const {League, Division} = require('../../models/league');
const {Team} = require('../../models/team');

router.get('/', isAdmin, async (req, res, next) => {
  try {
    const teams = await Team.find();
    res.send(teams);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', loggedIn, async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID');
      err.status = 404;
      throw err;
    }

    let team = await Team.findById(id)
      .populate('roster.user')
      .populate('pending')
      .populate('leagues', 'name schedule teams divisions')
      .populate('feed.from', 'name email img');
      
    team = Team.formatRoster(team);
    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.post('/', isAdmin, async (req, res, next) => {
  let league,
      division;

  const {
    leagueId, 
    divisionId,
    name,
    status
  } = req.body;

  // if leagueId provided, check if valid and exists
  if (leagueId) {
    if (ObjectID.isValid(leagueId)) {
      league = await League.findById(leagueId);
      if (!league) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  // if divisionId provided, check if valid and exists
  if (divisionId) {
    if (ObjectID.isValid(divisionId)) {
      division = await Division.findById(divisionId);
      if (!division) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  try {
    // create save team
    const team = new Team({name, status});
    await team.save();

    // if league, save
    if (league) {
      league.teams.push(team);
      await league.save();
    }

    // if division, save
    if (division) {
      division.teams.push(team);
      await division.save();
    }

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', isAdmin, async (req, res, next) => {
  let league,
      division;

  const id = req.params.id;
  const {
    leagueId, 
    divisionId,
    name,
    status
  } = req.body;
  
  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  // if leagueId provided, check if valid and exists
  if (leagueId) {
    if (ObjectID.isValid(leagueId)) {
      league = await League.findById(leagueId);
      if (!league) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  // if divisionId provided, check if valid and exists
  if (divisionId) {
    if (ObjectID.isValid(divisionId)) {
      division = await Division.findById(divisionId);
      if (!division) res.status(404).send();
    } else {
      res.status(404).send();
    }
  }

  try {
    const team = await Team.findById(id);

    if (team) {
      team.name = name;
      team.status = status;

      await team.save();
    }

    // if league, update
    if (league) {
      await league.teams.findByIdAndUpdate(team._id, {name, status});
    }

    // if division, update
    if (division) {
      await division.teams.findByIdAndUpdate(team._id, {name, status});
    }

    res.send(team);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', isAdmin, async (req, res, next) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    throw err;
  }

  try {
    await Team.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    next(e);
  }
});

router.use('/:id/users', isAdmin, require('./users'));
router.use('/:id/feed', loggedIn, require('./feed'));
router.use('/:id/invite', loggedIn, require('./invite'));

module.exports = router;