var assert = require('assert');
var LobbyUser = require('../lib/lobby-user');

describe('lobbyUserModel', function() {
  describe('constructor', function() {
    it('sets the base user data', function() {
      var now = Date.now();
      var lobbyUser = new LobbyUser({id: "user id", info: "user info"});

      assert.ok(now < lobbyUser.joinTime < Date.now());
      assert.ok(now < lobbyUser.lastCheckIn < Date.now());
      assert.equal(lobbyUser.hasReceivedLobbyClosureInfo, false);
    });
    it('joinTime is unwriteable', function() {
      var now = Date.now();
      var lobbyUser = new LobbyUser({ id: "user id", info: "user info"});

      lobbyUser.joinTime = Date.now() + 1000;

      assert.ok(now < lobbyUser.joinTime < Date.now());
    });
    it('lastCheckIn is unwriteable', function() {
      var now = Date.now();
      var lobbyUser = new LobbyUser({ id: "user id", info: "user info"});

      lobbyUser.lastCheckIn = Date.now() + 1000;

      assert.ok(now < lobbyUser.lastCheckIn < Date.now());
    });
    it('hasReceivedLobbyClosureInfo is unwriteable', function() {    var now = Date.now();
      var lobbyUser = new LobbyUser({ id: "user id", info: "user info"});

      lobbyUser.hasReceivedLobbyClosureInfo = true;

      assert.equal(lobbyUser.hasReceivedLobbyClosureInfo, false);
    });
  });
  describe('checkIn', function() {
    it('sets the lastCheckIn time', function() {
      var now = Date.now();
      var lobbyUser = new LobbyUser({ id: "user id", info: "user info"});

      lobbyUser.checkIn();

      assert.ok(now <= lobbyUser.lastCheckIn <= Date.now());
    });
  });
  describe('acknowledgeLobbyCloser', function() {
    it('set hasReceivedLobbyClosureInfo to true', function() {
      var lobbyUser = new LobbyUser({id: "user id", info: "user info"});

      lobbyUser.acknowledgeLobbyClosure();

      assert.ok(lobbyUser.hasReceivedLobbyClosureInfo);
    });
  });
});