const router = require('express').Router();
const {ObjectID} = require('mongodb');

const upload = require('../../middleware/upload');
const {User} = require('../../models/user');
const {Team} = require('../../models/team');

router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const user = await User.findById(id);
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/', async (req, res, next) => {
  const {
    name, 
    email, 
    address, 
    phone, 
    secondary, 
    emergency, 
    comments } = req.body;

  const user = new User({
    name,
    email,
    address, 
    phone, 
    secondary, 
    emergency, 
    comments
  });

  try {
    await user.save();
    res.send(user);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = req.params.id;
  const {
    name, 
    address, 
    phone, 
    secondary, 
    emergency, 
    comments } = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('ID not found.');
      err.status = 404;
      throw err;
    }

    const user = await User.findById(id);
    user.name = name;
    user.address = address;
    user.phone = phone;
    user.secondary = secondary;
    user.emergency = emergency;
    user.comments = comments;

    await user.save();
    res.send(user);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    // remove user from any teams they are on
    await Team.updateMany(
      { 'roster.user': id }, 
      { $pull: { roster: { user: id } } }
    );

    // delete user
    await User.findByIdAndDelete(id);

    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/confirm', async (req, res, next) => {
  const id = req.params.id;
  const code = req.body.code;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id, '+tokens');

    if (!user) {
      const err = new Error('User not found.');
      err.status = '404';
      throw err;
    };

    if (user.confirmEmail(code)) { res.send(); } 
  } catch (e) {
    next(e);
  }
});

router.post('/:id/password', async (req, res, next) => {
  const id = req.params.id;
  const {code, password} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id, '+tokens');

    if (!user) {
      const err = new Error('User not found.');
      err.status = '404';
      throw err;
    };

    if (user.confirmEmail(code)) {
      user.password = password;
      user.tokens = [];
      const tokens = await user.generateTokens();
      
      res.send({
        _id: user._id,
        email: user.email,
        ...tokens
      });
    }
  } catch (e) {
    next(e);
  }
});

router.put('/:id/password', async (req, res, next) => {
  const id = req.params.id;
  const {old, password} = req.body;

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id, '+password');

    if (!user) {
      const err = new Error('User not found.');
      err.status = '404';
      throw err;
    };

    await user.verifyPassword(old);
    user.password = password;
    await user.save();

    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/email', async (req, res, next) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({email});

    if (user) {
      const err = new Error('Email Taken.');
      err.status = 409;
      throw err;
    } 
    
    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/recover', async (req, res, next) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({email}, '+tokens');

    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    user.recoverPassword();
    await user.save();
    
    res.send();
  } catch (e) {
    next(e);
  }
});

router.post('/:id/img', upload, async (req, res, next) => {
  const id = req.params.id;
  const url = req.protocol + '://' + req.get('host');

  try {
    if (!ObjectID.isValid(id)) {
      const err = new Error('Invalid ID.');
      err.status = '404';
      throw err;
    }

    const user = await User.findById(id);

    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    const path = `${url}/public/users/${id}/${req.file.fileName}`;

    user.img = path;

    await user.save();
    
    res.send(user);
  } catch (e) {
    next(e);
  }
});

router.post('/search', async (req, res, next) => {
  const {email} = req.body;

  if (!email) {
    const err = new Error('No Email');
    err.status = 400;
    throw err;
  }

  try {
    const user = await User.findOne({ email }, 'name fullName email img');

    res.send(user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;