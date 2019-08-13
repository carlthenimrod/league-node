const router = require('express').Router();

// controllers
const authController = require('../controllers/auth');
const leagueDivisions = require('../controllers/leagues/divisions');
const leagueTeams = require('../controllers/leagues/teams');
const leagueSchedule = require('../controllers/leagues/schedule');
const leagues = require('../controllers/leagues');
const teamFeed = require('../controllers/teams/feed');
const teamInvite = require('../controllers/teams/invite');
const teams = require('../controllers/teams');
const users = require('../controllers/users');
const userNotifications = require('../controllers/users/notifications');
const places = require('../controllers/places');
const notices = require('../controllers/notices');

// middleware
const {auth} = require('../middleware/auth');

// routes
router.use('/auth', authController);
router.use('/leagues/:id/divisions', leagueDivisions);
router.use('/leagues/:id/teams', leagueTeams);
router.use('/leagues/:id/schedule', leagueSchedule);
router.use('/leagues', leagues);
router.use('/teams/:id/feed', teamFeed);
router.use('/teams/:id/invite', auth, teamInvite);
router.use('/teams', teams);
router.use('/users', users);
router.use('/users/:id/notifications', userNotifications);
router.use('/places', places);
router.use('/notices', notices);

// 404
router.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// error handler
router.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      message: error.message
    }
  });
});

module.exports = router;