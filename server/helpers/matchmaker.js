const moment = require('moment');
const _ = require('lodash');

const {Game} = require('../models/game');

matchmaker = function (league, options) {
  if (options.strategy === 'week') {
    let {total, per} = options;

    if (+total && +per) {
      const teams = createTeams(league);

      while (total > 0) {
        const label = labelMaker(league);
        const games = createGames(league, teams, per);

        league.schedule.push({ label, games });

        --total;
      }
    } else {
      throw new Error('Options Invalid');
    }
  } else if (options.strategy === 'date') {
    let {start, end, days} = options;

    if (start && end && days) {
      start = moment(start);
      end = moment(end);

      if (!start.isValid() || !end.isValid()) {
        throw new Error('Dates Invalid');
      }

      if (!(days instanceof Array) || days.length === 0) {
        throw new Error('No Days included');
      }
      
      const teams = createTeams(league);
      const games = [];

      while (start.isSameOrBefore(end)) {
        const label = labelMaker(league);
        const day = start.format('dddd');

        // create single set of games if match
        if (days.indexOf(day) > -1) {
          games.push(...createGames(league, teams, 1, start));
        }

        // new week, add games, reset data
        if (day === 'Sunday' && games.length > 0) {
          league.schedule.push({ label, games });
          games.length = 0;
        }
        
        start.add(1, 'd');
      }
    } else {
      throw new Error('Options Invalid');
    }
  }
}

labelMaker = function (league) {
  if (league.schedule.length > 0) {
    const last = league.schedule[league.schedule.length - 1].label;
    const label = last.substr(0, last.indexOf(' '));
    const num = parseInt(last.substr(last.indexOf(' ') + 1));

    if (typeof num === 'number') {
      return label + ' ' + (num + 1);
    } else {
      return 'New Game Group 1'
    }
  } else {
    return 'Week 1';
  }
}

shuffle = function (a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

createTeams = function (league) {
  const teams = [];

  for (let i = 0; i < league.teams.length; i++) {
    const team = {
      _id: league.teams[i]._id,
      set: 0,
      played: [],
      notPlayed: [],
      opponents: [],
      byes: 0,
      home: 0,
      away: 0,
      total: 0
    }

    teams.push(team);
  }

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];

    // create array of opponents
    for (let x = 0; x < teams.length; x++) {
      const opponent = teams[x];

      if (team._id === opponent._id) { continue; }

      team.opponents.push({
        _id: opponent._id,
        timesPlayed: 0
      });

      team.notPlayed.push(opponent._id);
    }

    // check existing games
    for (let i = 0; i < league.schedule.length; i++) {
      const group = league.schedule[i];
      
      for (let x = 0; x < group.games.length; x++) {
        const game = group.games[x];
        
        // add to totals
        if (game.home._id.equals(team._id)) {
          ++team.home;
          ++team.total;

          const opponent = team.opponents.find(o => o._id.equals(game.away._id));
          ++opponent.timesPlayed;
        } else if (game.away._id.equals(team._id)) {
          ++team.away;
          ++team.total;

          const opponent = team.opponents.find(o => o._id.equals(game.home._id));
          ++opponent.timesPlayed;
        }
      }
    }
  }

  return teams;
}

createGames = function (league, teams, set, date) {
  const games = [];
  let current = 0;
  
  while (current < set) {
    shuffle(teams);

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];

      // if doesn't have game already
      if (team.set <= current) {
        const host = (team.home <= team.away) ? true : false;
        const match = findOpponent(teams, team, host);

        if (!match) { 
          ++team.byes;
          continue; 
        }

        const opponent = teams[teams.findIndex(t => t._id.equals(match))];

        let home;
        let away;

        if (host) {
          home = league.teams.id(team._id);
          away = league.teams.id(match);

          ++team.home;
          ++opponent.away;
        } else {
          away = league.teams.id(team._id);
          home = league.teams.id(match);

          ++team.away;
          ++opponent.home;
        }

        // update team
        ++team.set;
        ++team.total;
        ++team.opponents.find(o => o._id.equals(match)).timesPlayed;
        team.played.push(match);
        team.notPlayed.splice(team.notPlayed.indexOf(match), 1);

        // update opponent
        ++opponent.set;
        ++opponent.total;
        ++opponent.opponents.find(o => o._id.equals(team._id)).timesPlayed;
        opponent.played.push(team._id);
        opponent.notPlayed.splice(opponent.notPlayed.indexOf(team._id), 1);

        const game = new Game({ 
          home: _.pick(home, ['_id', 'name']), 
          away: _.pick(away, ['_id', 'name']) 
        });

        if (date) game.start = date;
        games.push(game);
      }
    }

    // reset values for teams played / notPlayed for next iteration
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];

      team.played.length = 0;
      team.notPlayed = teams.reduce((acc, t) => {
        if (!team._id.equals(t._id)) {
          acc.push(t._id);
        }

        return acc;
      }, []);
    }

    ++current;
  }

  // reset values for next set
  for (let i = 0; i < teams.length; i++) {
    teams[i].set = 0;
  }

  return games;
}

findOpponent = function (teams, team, host) {
  let matches = [];

  // find potential matches
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];

    // check if same team
    if (t._id.equals(team._id)) continue;

    // check if has already played another team this set
    if (t.set > team.set) continue;

    // check if already played
    if (t.played.indexOf(team._id) > -1) continue;

    // add to potential matches
    matches.push({
      _id: t._id,
      home: t.home,
      away: t.away
    });
  }

  // no match
  if (matches.length === 0) { return false; }

  // check each match for best match
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    m.points = 0;

    // add / subtract points based on total home / away games
    if (host) {
      if (m.home > m.away) { m.points = m.points + 2; }
      if (m.home === m.away) { m.points = m.points + 1; }
    } else {
      if (m.away > m.home) { m.points = m.points + 2; }
      if (m.away === m.home) { m.points = m.points + 1; }
    }

    // check how many games already played against
    const opponent = team.opponents.find(o => o._id.equals(m._id));
    m.points = m.points - opponent.timesPlayed;
  }

  // get best match
  let bestMatch;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    
    if (!bestMatch) { 
      bestMatch = m;
      continue;
    }
    
    if (m.points > bestMatch.points) {
      bestMatch = m;
    }
  }

  return bestMatch._id;
}

module.exports = matchmaker;