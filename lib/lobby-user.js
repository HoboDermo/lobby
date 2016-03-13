/**
 * Construct a new lobby user
 * @constructor
 * @class LobbyUser
 * @param {object} userObject - the user instance
 */
function LobbyUser(userObject) {
  'use strict';
  this.base = userObject;
  var joinTime = Date.now();
  var lastCheckIn = Date.now();
  var hasReceivedLobbyClosureInfo = false;

  /**
   * Update last check in time to Date.now()
   */
  this.checkIn = function() {
    lastCheckIn = Date.now();
  };
  /**
   * Acknowledge lobby closure
   */
  this.acknowledgeLobbyClosure = function() {
    hasReceivedLobbyClosureInfo = true;
  };

  Object.defineProperties(this, {
    'joinTime': {
      get: function() { return joinTime; },
      enumerable: true
    },
    'lastCheckIn': {
      get: function() { return lastCheckIn; },
      enumerable: true
    },
    'hasReceivedLobbyClosureInfo': {
      get: function() { return hasReceivedLobbyClosureInfo; },
      enumerable: true
    }
  });
}

module.exports = LobbyUser;