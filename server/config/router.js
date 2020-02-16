const router = require('express').Router();

// middleware
const {isAdmin} = require('../middleware/auth');

// controllers
const authController = require('../controllers/auth');
const leagueController = require('../controllers/leagues');
const teamController = require('../controllers/teams');
const userController = require('../controllers/users');
const placeController = require('../controllers/places');

// routes
router.use('/auth', authController);
router.use('/leagues', leagueController);
router.use('/teams', teamController);
router.use('/users', userController);
router.use('/places', isAdmin, placeController);

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