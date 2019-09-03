const router = require('express').Router();

// middleware
const {isAdmin} = require('../middleware/auth');

// controllers
const authController = require('../controllers/auth');
const leagues = require('../controllers/leagues');
const teams = require('../controllers/teams');
const users = require('../controllers/users');
const places = require('../controllers/places');
const notices = require('../controllers/notices');

// routes
router.use('/auth', authController);
router.use('/leagues', leagues);
router.use('/teams', teams);
router.use('/users', users);
router.use('/places', isAdmin, places);
router.use('/notices', isAdmin, notices);

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