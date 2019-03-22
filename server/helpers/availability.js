const moment = require('moment');

const {Place} = require('../models/place');

const availability = (function() {
  let place;

  const check = async (game) => {
    if (!game.place._id) { 
      const err = new Error('Place ID invalid');
      err.status = 404;
      throw err;
    }

    // remove game from all places
    await Place.updateMany({ 'permits.slots.games._id': game._id }, 
    { $pull: { 'permits.$[].slots.$[].games': { _id: game._id } } });

    place = await Place.findById(game.place._id);

    if (!place) {
      const err = new Error('Place Not Found');
      err.status = 404;
      throw err;
    }

    searchPermits(place, game);

    await place.save();
  };

  const searchPermits = (place, game) => {
    const gameStart = moment(game.start);
    const gameEnd = gameStart.clone().add(2, 'hours');

    if (!place.permits || place.permits.length === 0) {
      const err = new Error('No Permits Available');
      err.status = 400;
      throw err;
    }

    for (let i = 0; i < place.permits.length; i++) {
      const permit = place.permits[i];

      const slot = searchSlots(permit.slots, gameStart, gameEnd);

      if (!slot) continue;

      // check place has locations, check if locations are available
      if (place.locations && place.locations.length > 0) {
        searchLocations(game, place.locations, slot);
      }

      if (slot.games && slot.games.length > 0) {
        const conflict = checkConflicts(game, slot);

        // try next
        if (conflict) continue;
      }

      // add game to time slot
      slot.games.push({
        _id: game._id,
        locations: game.place.locations,
        start: game.start
      });

      return true;
    }

    const err = new Error('No slot available');
    err.status = 404;
    throw err;
  };

  const searchSlots = (slots, gameStart, gameEnd) => {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const slotStart = moment(slot.start);
      const slotEnd = moment(slot.end);

      // check if game start time fits into slot
      if (gameStart.isSameOrAfter(slotStart) && gameEnd.isSameOrBefore(slotEnd)) {
        return slot;
      }
    }
  }

  const searchLocations = (game, locations) => {
    // make sure game has locations selected
    if (!game.place.locations || game.place.locations.length === 0) { 
      const err = new Error('Game needs to select locations');
      err.status = 400;
      throw err;
    }

    // check every location exists
    for (let i = 0; i < game.place.locations.length; i++) {
      const location = game.place.locations[i];
      
      const index = locations.findIndex(l => l._id.equals(location._id));

      if (index === -1) { 
        const err = new Error('Locations missing');
        err.status = 400;
        throw err;
      }
    }
  };

  const checkConflicts = (game, slot) => {
    const locations = game.place.locations;
    const checkLocations = (locations.length > 0) ? true : false;
    const gameStart = moment(game.start);
    const gameEnd = gameStart.clone().add(2, 'hours');

    for (let i = 0; i < slot.games.length; i++) {
      const start = moment(slot.games[i].start);
      const end = start.clone().add(2, 'hours');

      // check if game is same time or between existing game
      if (gameStart.isSame(start) || 
          gameEnd.isSame(end) || 
          gameStart.isBetween(start, end) || 
          gameEnd.isBetween(start, end) 
      ) {
      
        // if we don't need to check locations, just return true
        if (!checkLocations) { return true; }

        // check if there is a location conflict, return true if so
        for (let x = 0; x < locations.length; x++) {
          const loc = locations[x];

          const index = slot.games[i].locations.findIndex(l => l._id.equals(loc._id));
          if (index > -1) { return true; }
        }
      }
    }

    // no conflicts
    return false;
  };

  return { check }
})();

module.exports = availability;