var assert = require('assert');
var lobbyController = require('../lib/lobby-controller');

describe('lobbyController', function() {

  describe('setup', function() {
    it('allows custom user object identifier property', function() {
      var controller = lobbyController({
        userObjectIdentifierProperty: '_id'
      });
      var user1 = { _id: 1, name: 'Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      var lobby1 = controller.join('lobby type', user1);
      var lobby2 = controller.join('lobby type', user1);

      assert.equal(lobby2.type,lobby1.type);
      assert.equal(lobby2.id,lobby1.id);
    });
  });

  describe('addLobbyType', function() {
    it('throws an error when type is not a string', function() {
      var controller = lobbyController();

      var fn = function() {
        controller.addLobbyType({
          type: null,
          minUsers: 4,
          maxUsers: 8
        });
      };

      assert.throws(fn, TypeError);
    });
    it('throws an error when minUsers is not a number', function() {
      var controller = lobbyController();

      var fn = function() {
        controller.addLobbyType({
          type: 'lobby type',
          minUsers: 'not a number',
          maxUsers: 8
        });
      };

      assert.throws(fn, TypeError);
    });
    it('throws an error when maxUsers is not a number', function() {
      var controller = lobbyController();

      var fn = function() {
        controller.addLobbyType({
          type: 'lobby type',
          minUsers: 4,
          maxUsers: 'not a number'
        });
      };

      assert.throws(fn, TypeError);
    });
    it('fails if maxUsers < minUsers', function() {
      var controller = lobbyController();

      var result = controller.addLobbyType({
        type: 'lobby type',
        minUsers: 4,
        maxUsers: 2
      });

      assert.equal(result, false);
    });
    it('succeeds if minUsers <= maxUsers', function() {
      var controller = lobbyController();

      var result = controller.addLobbyType({
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      });

      assert.ok(result);
    });
  });

  describe('getAll', function() {
    it('returns all lobbies by default', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};
      var user2 = { id: 2, name: 'Di-Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      var lobby2Config = {
        type: 'other lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      controller.addLobbyType(lobby2Config);
      var lobby1 = controller.join('lobby type', user1);
      var lobby2 = controller.join('other lobby type', user2);

      var lobbies = controller.getAll();

      assert.equal(lobbies.length,2);
      assert.equal(lobbies[0].type,lobby1.type);
      assert.equal(lobbies[0].id,lobby1.id);
      assert.equal(lobbies[1].type,lobby2.type);
      assert.equal(lobbies[1].id,lobby2.id);
    });
    it('returns only lobbies that the user is in when there is a user parameter', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};
      var user2 = { id: 2, name: 'Di-Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      var lobby2Config = {
        type: 'other lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      controller.addLobbyType(lobby2Config);
      var lobby1 = controller.join('lobby type', user1);
      var lobby2 = controller.join('other lobby type', user2);

      var lobbies = controller.getAll(user1);

      assert.equal(lobbies.length,1);
      assert.equal(lobbies[0].type,lobby1.type);
      assert.equal(lobbies[0].id,lobby1.id);
    });
  });

  describe('get', function() {
    it('return lobby', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      var lobby1 = controller.join('lobby type', user1);

      var lobby = controller.get(lobby1.id);

      assert.equal(lobby.type,lobby1.type);
      assert.equal(lobby.id,lobby1.id);
    });
    it('throws an error if lobby does not exist', function() {
      var controller = lobbyController();

      var fn = function() {
        controller.get("not an id");
      };

      assert.throws(fn);
    });
  });

  describe('join', function() {
    it('throws an error if lobby type does not exist', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};

      var fn = function() {
        controller.join("not a lobby type", user1);
      };

      assert.throws(fn);
    });
    it('returns lobby if user is already in an open lobby of the correct type', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      var lobby1 = controller.join('lobby type', user1);

      var lobby2 = controller.join('lobby type', user1);

      assert.equal(lobby2.type,lobby1.type);
      assert.equal(lobby2.id,lobby1.id);
    });
    it('returns lobby if there is space available in an open lobby of the correct type', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};
      var user2 = { id: 2, name: 'Di-Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      var lobby1 = controller.join('lobby type', user1);

      var lobby2 = controller.join('lobby type', user2);

      assert.equal(lobby2.type,lobby1.type);
      assert.equal(lobby2.id,lobby1.id);
    });
    it('returns new lobby if a match is not found in currently open lobbies', function() {
      var controller = lobbyController();
      var user1 = { id: 1, name: 'Blah'};
      var user2 = { id: 2, name: 'Di-Blah'};
      var lobby1Config = {
        type: 'lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      var lobby2Config = {
        type: 'other lobby type',
        minUsers: 2,
        maxUsers: 4
      };
      controller.addLobbyType(lobby1Config);
      controller.addLobbyType(lobby2Config);
      var lobby1 = controller.join('lobby type', user1);

      var lobby2 = controller.join('other lobby type', user2);

      assert.notEqual(lobby2.type,lobby1.type);
      assert.notEqual(lobby2.id,lobby1.id);
    });
  });
});