const router = require('express').Router();

const auth = require('../controllers/auth');
const leagueDivisions = require('../controllers/leagues/divisions');
const leagueTeams = require('../controllers/leagues/teams');
const leagueSchedule = require('../controllers/leagues/schedule');
const leagues = require('../controllers/leagues');
const teamFeed = require('../controllers/teams/feed');
const teams = require('../controllers/teams');
const users = require('../controllers/users');
const places = require('../controllers/places');
const notices = require('../controllers/notices');

router.use('/auth', auth);
router.use('/leagues/:id/divisions', leagueDivisions);
router.use('/leagues/:id/teams', leagueTeams);
router.use('/leagues/:id/schedule', leagueSchedule);
router.use('/leagues', leagues);
router.use('/teams/:id/feed', teamFeed);
router.use('/teams', teams);
router.use('/users', users);
router.use('/places', places);
router.use('/notices', notices);

router.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

router.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      message: error.message
    }
  });
});

module.exports = router;