var updateTracker = require('update-tracker');
var fnRunner = require('fn-runner');
var uuid = require('uuid');
var LobbyUser = require('./lobby-user');

var messages = {
  User_Joins: 'User has joined lobby.',
  User_Leaves: 'User has left lobby.',
  Lobby_Ready: 'Lobby is ready.',
  Lobby_Not_Ready: 'Lobby is waiting for more users.',
  Lobby_Closed: 'Lobby is closed.',
  Lobby_Ready_To_Archive: 'Lobby is ready to be archived.',
  User_Not_Found: 'User not found in lobby.'
};

/**
 * Construct a new lobby instance
 * @constructor
 * @class Lobby
 * @param {string} _type - the type of lobby
 * @param {object} _config - lobby config
 * @param {string} _config.userObjectIdentifierProperty - property name of unique identifier of user objects
 * @param {int} _config.userTimeout - the number of ms of inactivity before the user is kicked out
 * @param {int} _config.readyTimeout - the number of ms to wait once ready until lobby is closed
 * @param {int} _config.checkCurrentUsersInterval - the number of ms in between checking current users timeout
 * @param {int} _config.checkClosedStatusInterval - the number of ms in between checking closed status
 * @param {int} _config.minUsers - the minimum number of users needed to close
 * @param {int} _config.maxUsers - the maximum number of users allowed in lobby
 * @param {function} [_config.closedCallback] - function to be called when lobby is closed
 * @param {object[]} [_users] - list of initial users
 */
function Lobby(_type, _config, _users) {
  'use strict';
  var lobby = this;
  var id = uuid.v4();
  var type = _type;
  var users = [];
  var isReady = false; //Are there enough users
  var timeDeclaredReady = null; //Time since there were enough users
  var isClosed = false; //Is the lobby closed to new users
  var timeClosed = null; //Time since lobby was closed
  var canRemove = false; //Can the lobby be archived
  var config = {
    userObjectIdentifierProperty: _config.userObjectIdentifierProperty,
    userTimeout: _config.userTimeout,
    readyTimeout: _config.readyTimeout,
    checkCurrentUsersInterval: _config.checkCurrentUsersInterval,
    checkClosedStatusInterval: _config.checkClosedStatusInterval,
    minUsers: _config.minUsers,
    maxUsers: _config.maxUsers,
    closedCallback: _config.closedCallback
  };
  var updates = new updateTracker();

  Object.defineProperties(this, {
    /**
     * @property {string} id - lobby identifier
     * @memberOf Lobby
     */
    'id': {
      get: function() { return id; },
      enumerable: true
    },
    /**
     * @property {string} type - the type of lobby
     * @memberOf Lobby
     */
    'type': {
      get: function() { return type; },
      enumerable: true
    },
    /**
     * @property {object[]} users - the users in the lobby
     * @memberOf Lobby
     */
    'users': {
      get: function() { return users.map(function(user) {
        return user.base;
      }); },
      enumerable: true
    },
    /**
     * @property {boolean} isReady - is the lobby ready to be closed
     * @memberOf Lobby
     */
    'isReady': {
      get: function() { return isReady; },
      enumerable: true
    },
    /**
     * @property {number} timeDeclaredReady - the time the lobby was declared ready
     * @memberOf Lobby
     */
    'timeDeclaredReady': {
      get: function() { return timeDeclaredReady; },
      enumerable: true
    },
    /**
     * @property {boolean} isClosed - is the lobby closed
     * @memberOf Lobby
     */
    'isClosed': {
      get: function() { return isClosed; },
      enumerable: true
    },
    /**
     * @property {number} timeClosed - the time the lobby was declared closed
     * @memberOf Lobby
     */
    'timeClosed': {
      get: function() { return timeClosed; },
      enumerable: true
    },
    /**
     * @property {boolean} canRemove - can the lobby be removed/archived
     * @memberOf Lobby
     */
    'canRemove': {
      get: function() { return canRemove; },
      enumerable: true
    }
  });

  var checkCurrentUsersTimer = null;
  var checkClosedStatusTimer = null;

  /**
   * Subscribe to updates
   * @param {object} user - the user subscribing
   * @param {function} callback - the function to be called at each update
   */
  this.subscribe = function(user, callback) {
    //Subscribe by id
    updates.subscribe(user[config.userObjectIdentifierProperty].toString(), callback);
  };

  /**
   * Unsubscribe from updates
   * @param {object} user - the user unsubscribing
   */
  this.unsubscribe = function(user) {
    //Unsubscribe by id
    updates.unsubscribe(user[config.userObjectIdentifierProperty].toString());
  };

  /**
   * Join the lobby
   * @param {object} user - the user joining
   * @returns {boolean} true if successful
   */
  this.join = function(user) {
    try {
      var currentUser = getUser(user[config.userObjectIdentifierProperty]);
      currentUser.checkIn();
      return true;
    } catch(e) {
      checkCurrentUsers();
      if(!isClosed &&
        users.length < config.maxUsers) {
        users.push(new LobbyUser(user));
        updates.add(messages.User_Joins, user);
        if(!isReady) {
          checkReadyStatus();
        }
        return true;
      }
      return false;
    }
  };

  /**
   * Leave the lobby
   * @param {object} user - the user leaving
   * @returns {boolean} true if successful
   */
  this.leave = function(user) {
    try {
      getUser(user[config.userObjectIdentifierProperty]);
      if (!isClosed) {
        users = users.filter(function (filterUser) {
          return filterUser.base[config.userObjectIdentifierProperty]
            !== user[config.userObjectIdentifierProperty];
        });
        updates.add(messages.User_Leaves, user);
        if (isReady) {
          checkReadyStatus();
        }
        return true;
      }
      return false;
    } catch(e) {
      return false;
    }
  };

  /**
   * User check in
   * @param {object} user - the user checking in
   * @returns {boolean} true if successful
   */
  this.checkIn = function(user) {
    try {
      var foundUser = getUser(user[config.userObjectIdentifierProperty]);
      foundUser.checkIn();
      return true;
    } catch(e) {
      return false;
    }
  };

  /**
   * Acknowledge closure of lobby
   * @param {object} user - the user acknowledging
   * @returns {boolean} true if successful
   */
  this.acknowledgeLobbyClosure = function(user) {
    if(isClosed) {
      try {
        var foundUser = getUser(user[config.userObjectIdentifierProperty]);
        foundUser.acknowledgeLobbyClosure();
        checkCanRemoveStatus();
        return true;
      } catch(e) {
        return false;
      }
    }
    return false;
  };

  /**
   * Check if a user is in the lobby
   * @param {object} user - the user
   * @returns {boolean} true if user is in lobby
   */
  this.hasUser = function(user) {
    try {
      getUser(user[config.userObjectIdentifierProperty]);
      return true;
    } catch(e) {
      return false;
    }
  };

  function checkCurrentUsers() {
    var timeOutUsers = users.filter(function(user) {
      return (user.lastCheckIn + config.userTimeout) < Date.now();
    });

    timeOutUsers.forEach(function(user) {
      lobby.leave(user.base);
    });
  }

  function checkReadyStatus() {
    var currentUsers = users.length;

    var lastReadyState = isReady;
    if(currentUsers >= config.minUsers && currentUsers <= config.maxUsers) {
      isReady = true;
      timeDeclaredReady = timeDeclaredReady || Date.now();
    } else {
      isReady = false;
      timeDeclaredReady = null;
    }

    if(lastReadyState !== isReady) {
      if(isReady) {
        checkClosedStatusTimer.start();
        updates.add(messages.Lobby_Ready, lobby);
      } else {
        checkClosedStatusTimer.stop();
        updates.add(messages.Lobby_Not_Ready, lobby);
      }
    }
  }

  function checkClosedStatus() {
    if(isReady && !isClosed &&
      Date.now() > timeDeclaredReady + config.readyTimeout) {

      isClosed = true;
      timeClosed = Date.now();
      checkCurrentUsersTimer.stop();
      checkClosedStatusTimer.stop();
      updates.add(messages.Lobby_Closed, lobby);
      //Switch to return users
      config.closedCallback(lobby);
    }
  }

  function checkCanRemoveStatus() {
    if(isReady && isClosed && !canRemove) {
      if(users.every(function(user) {
          return user.hasReceivedLobbyClosureInfo;
        })) {
        canRemove = true;
        updates.add(messages.Lobby_Ready_To_Archive, lobby, true);
      }
    }
  }

  function getUser(id) {
    var result = users.filter(function(user) {
      return user.base[config.userObjectIdentifierProperty] == id;
    });
    if(result.length === 1) {
      return result[0];
    }
    throw messages.User_Not_Found;
  }

  checkClosedStatusTimer = new fnRunner(config.checkClosedStatusInterval, checkClosedStatus);
  checkCurrentUsersTimer =  new fnRunner(config.checkCurrentUsersInterval, checkCurrentUsers, true);
  if(_users) {
    _users.forEach(function(user) {
      lobby.join(user);
    });
  }
}

module.exports = Lobby;
