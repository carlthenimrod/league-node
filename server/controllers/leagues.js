const router = require('express').Router();
const {ObjectID} = require('mongodb');

const {League} = require('../models/league');
const {Division} = require('../models/division');

router.get('/', async (req, res) => {
  try {
    const leagues = await League.find()
      .populate({
        path: 'divisions',
        populate: { path: 'divisions' }
      });
      
    res.send(leagues);
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
    const leagues = await League.findById(id)
      .populate({
        path: 'divisions',
        populate: { path: 'divisions' }
      });

    res.send(leagues);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/', async (req, res) => {
  const league = new League({
    name: req.body.name,
    description: req.body.description,
    start: req.body.start,
    end: req.body.end
  });

  try {
    await league.save();
    res.send(league);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const {name, description} = req.body;
    const league = await League.findByIdAndUpdate(id, {
      name,
      description
    }, {
      new: true
    });
    res.send(league);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    res.status(404).send();
  }

  try {
    await League.findByIdAndDelete(id);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/:id/divisions', async (req, res) => {
  const id = req.params.id;
  let parent = req.body.parent;
  
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    // get parent, send error if not found
    if (parent) {
      if (!ObjectID.isValid(parent)) {
        return res.status(404).send();
      }
      parent = await Division.findById(parent);
    } else {
      parent = await League.findById(id);
    }
    if (!parent) res.status(404).send(e);

    // create division
    const division = new Division({
      name: req.body.name
    });

    // save division / parent
    await division.save();
    parent.divisions.push(division._id);
    await parent.save();

    res.send(division);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.put('/:id/divisions/:divisionId', async (req, res) => {
  const id = req.params.id;
  const divisionId = req.params.divisionId;
  let parent = req.body.parent;
  
  if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
    return res.status(404).send();
  }

  try {
    // get parent, send error if not found
    if (parent) {
      if (!ObjectID.isValid(parent)) {
        return res.status(404).send();
      }
      parent = await Division.findById(parent);
    } else {
      parent = await League.findById(id);
    }
    if (!parent) res.status(404).send(e);

    // remove as a child from all leagues / divisions
    await League.updateMany({
      divisions: ObjectID(divisionId)
    }, {
      $pull: { divisions: ObjectID(divisionId)}
    });

    await Division.updateMany({
      divisions: ObjectID(divisionId)
    }, {
      $pull: { divisions: ObjectID(divisionId)}
    });
    
    // save division / parent
    const {name} = req.body;
    const division = await Division.findByIdAndUpdate(divisionId, {
      name
    }, {
      new: true
    });
    parent.divisions.push(division._id);
    await parent.save();

    // if division has children, add to league
    if (division.divisions.length) {
      const league = await League.findById(id);

      // add ids
      division.divisions.forEach(division => {
        league.divisions.push(ObjectID(division));
      });

      // save
      league.save();
    } 
    
    res.send(division);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/:id/divisions/:divisionId', async (req, res) => {
  const id = req.params.id;
  const divisionId = req.params.divisionId;
  
  if (!ObjectID.isValid(id) || !ObjectID.isValid(divisionId)) {
    return res.status(404).send();
  }

  try {
    // get division
    const division = await Division.findById(divisionId);

    // if division has children, add to league
    if (division.divisions.length) {
      const league = await League.findById(id);

      // add ids
      division.divisions.forEach(division => {
        league.divisions.push(ObjectID(division));
      });

      // save
      league.save();
    } 

    // remove as a child from all leagues / divisions
    await League.updateMany({
      divisions: ObjectID(divisionId)
    }, {
      $pull: { divisions: ObjectID(divisionId)}
    });

    await Division.updateMany({
      divisions: ObjectID(divisionId)
    }, {
      $pull: { divisions: ObjectID(divisionId)}
    });

    // delete division
    await division.remove();
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;