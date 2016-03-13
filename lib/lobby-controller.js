var Lobby = require('./lobby');

/**
 * Lobby controller
 * @param {object} [customConfig] - default lobby config
 * @param {string} [customConfig.userObjectIdentifierProperty] - property name of unique identifier of user objects
 * @param {int} [customConfig.userTimeout] - the number of ms of inactivity before the user is kicked out
 * @param {int} [customConfig.readyTimeout] - the number of ms to wait once ready until lobby is closed
 * @param {int} [customConfig.checkCurrentUsersInterval] - the number of ms in between checking current users timeout
 * @param {int} [customConfig.checkClosedStatusInterval] - the number of ms in between checking closed status
 * @returns {{addLobbyType: addLobbyType, getAll: getAll, get: get, join: join}}
 */
var lobbyController = function(customConfig) {
  'use strict';
  var DEFAULT_USER_OBJECT_INDENTIFIER_PROPERTY = 'id';
  var DEFAULT_USER_TIMEOUT = 5000;
  var DEFAULT_READY_TIMEOUT = 30000;
  var DEFAULT_CHECK_CURRENT_USERS_INTERVAL = 1000;
  var DEFAULT_CHECK_CLOSED_STATUS_INTERVAL = 1000;

  customConfig = customConfig || {};

  var lobbies = [];
  var lobbyTypes = {};

  var config = {
    userObjectIdentifierProperty: customConfig.userObjectIdentifierProperty || DEFAULT_USER_OBJECT_INDENTIFIER_PROPERTY,
    userTimeout: customConfig.userTimeout || DEFAULT_USER_TIMEOUT,
    readyTimeout: customConfig.readyTimeout || DEFAULT_READY_TIMEOUT,
    checkCurrentUsersInterval: customConfig.checkCurrentUsersInterval || DEFAULT_CHECK_CURRENT_USERS_INTERVAL,
    checkClosedStatusInterval: customConfig.checkClosedStatusInterval || DEFAULT_CHECK_CLOSED_STATUS_INTERVAL
  };

  /**
   * Add a new lobby type configuration
   * @param {object} customLobbyConfig - default lobby config
   * @param {string} [customLobbyConfig.userObjectIdentifierProperty] - property name of unique identifier of user objects
   * @param {string} customLobbyConfig.type - the number of ms of inactivity before the user is kicked out
   * @param {int} customLobbyConfig.minUsers - the number of ms to wait once ready until lobby is closed
   * @param {int} customLobbyConfig.maxUsers - the number of ms in between checking current users timeout
   * @param {int} [customLobbyConfig.userTimeout] - the number of ms of inactivity before the user is kicked out
   * @param {int} [customLobbyConfig.readyTimeout] - the number of ms to wait once ready until lobby is closed
   * @param {int} [customLobbyConfig.checkCurrentUsersInterval] - the number of ms in between checking current users timeout
   * @param {int} [customLobbyConfig.checkClosedStatusInterval] - the number of ms in between checking closed status
   * @returns {boolean} true if successful
   */
  function addLobbyType(customLobbyConfig) {
    if(typeof customLobbyConfig.type !== 'string') throw new TypeError('Type must be a string.');
    if(typeof customLobbyConfig.minUsers !== 'number') throw new TypeError('MinUsers must be a number.');
    if(typeof customLobbyConfig.maxUsers !== 'number') throw new TypeError('MaxUsers must be a number.');
    if(customLobbyConfig.maxUsers < customLobbyConfig.minUsers) {
      return false;
    }

    lobbyTypes[customLobbyConfig.type] = {
      userObjectIdentifierProperty: customLobbyConfig.userObjectIdentifierProperty
      || config.userObjectIdentifierProperty,
      userTimeout: customLobbyConfig.userTimeout || config.userTimeout,
      readyTimeout: customLobbyConfig.readyTimeout || config.readyTimeout,
      checkCurrentUsersInterval: customLobbyConfig.checkCurrentUsersInterval || config.checkCurrentUsersInterval,
      checkClosedStatusInterval: customLobbyConfig.checkClosedStatusInterval || config.checkClosedStatusInterval,
      minUsers: customLobbyConfig.minUsers,
      maxUsers: customLobbyConfig.maxUsers,
      closedCallback: customLobbyConfig.checkClosedStatusInterval || config.checkClosedStatusInterval
    };
    return true;
  }

  /**
   * Get lobbies
   * @param {object} [user] user to filter lobbies by
   * @returns {Lobby[]} list of lobbies
   */
  function getAll(user) {
    if(user == null) {
      return lobbies;
    }
    return lobbies.filter(function(lobby) {
      return lobby.hasUser(user);
    });
  }

  /**
   * Get lobby instance
   * @param {string} lobbyId - lobby id
   * @returns {Lobby} lobby instance
   */
  function get(lobbyId) {
    var matchingLobbies = lobbies.filter(function(lobby) {
      return lobby.id === lobbyId;
    });
    if(matchingLobbies.length === 1) {
      return matchingLobbies[0];
    }
    throw 'Lobby not found.';
  }

  /**
   * Join a lobby
   * @param {string} type - lobby type
   * @param {object} user - user to be added to lobby
   * @returns {Lobby} lobby instance the user has joined
   */
  function join(type, user) {
    if(!lobbyTypes[type]) {
      throw 'Lobby type not found.';
    }
    var returnLobby = null;
    var openLobbiesOfType = lobbies.filter(function(lobby) {
      return !lobby.isClosed && lobby.type === type;
    });
    if(openLobbiesOfType.length) {
      var openLobbiesOfTypeWithUser = openLobbiesOfType.filter(function(lobby) {
        return lobby.hasUser(user);
      });
      if(openLobbiesOfTypeWithUser.length) {
        returnLobby = openLobbiesOfTypeWithUser[0];
      } else {
        for(var i=0; i<openLobbiesOfType.length; i++) {
          if(openLobbiesOfType[i].join()) {
            returnLobby = openLobbiesOfType[i];
            break;
          }
        }
      }
    }
    if(!returnLobby) {
      var lobbyConfig = lobbyTypes[type];
      returnLobby = new Lobby(type, lobbyConfig, [user]);
      lobbies.push(returnLobby);
    }

    return returnLobby;
  }

  return {
    addLobbyType: addLobbyType,
    getAll: getAll,
    get: get,
    join: join
  };
};

module.exports = lobbyController;
