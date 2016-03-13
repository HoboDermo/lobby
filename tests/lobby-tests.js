var assert = require('assert');
var Lobby = require('../lib/lobby');

describe('lobbyModel', function() {
  var defaultConfig = {
    userObjectIdentifierProperty: 'id',
    userTimeout: 1000,
    readyTimeout: 5000,
    checkCurrentUsersInterval: 1000,
    checkClosedStatusInterval: 1000,
    minUsers: 3,
    maxUsers: 6,
    closedCallback: function() {}
  };

  describe('constructor', function() {
    it('sets the base lobby data', function() {
      var users = [{id: 1, userId: 'one'}, {id: 2, userId: 'two'}];
      var lobby = new Lobby('type', defaultConfig, users);

      assert.equal(lobby.type, 'type');
      assert.deepEqual(lobby.users, users);
      assert.equal(lobby.isReady, false);
      assert.equal(lobby.timeDeclaredReady, null);
      assert.equal(lobby.isClosed, false);
      assert.equal(lobby.timeClosed, null);
      assert.equal(lobby.canRemove, false);
    });
    it('id is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('type is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('users is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('isReady is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('timeDeclaredReady is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('isClosed is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('timeClosed is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
    it('canRemove is unwriteable', function() {
      var lobby = new Lobby('type', defaultConfig, []);

      lobby.id = 'new value';

      assert.notEqual(lobby.id, 'new value');
    });
  });

  describe('subscribe', function() {
    it('registers the callback for updates', function() {
      var user = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig);
      var result;
      var callback = function(update) {
        result = update;
      };

      lobby.subscribe(user, callback);
      lobby.join(user);

      assert.deepEqual(result.data, user);
    });
  });

  describe('unsubscribe', function() {
    it('removes the callback for updates', function() {
      var user = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig);
      var result;
      var callback = function(update) {
        result = update;
      };

      lobby.subscribe(user, callback);
      lobby.unsubscribe(user, callback);
      lobby.join(user);

      assert.equal(result, null);
    });
  });

  describe('join', function() {
    it('checks in user if they are already in the lobby', function() {
      var user = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig, [user]);
      var result;

      result = lobby.join(user);

      assert.ok(result);
      assert.equal(lobby.users.length, 1);
    });
    it('adds user when lobby is at max capacity but another user has timed out', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 10,
        readyTimeout: 50,
        checkCurrentUsersInterval: 100,
        checkClosedStatusInterval: 100,
        minUsers: 1,
        maxUsers: 1,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      setTimeout(function() {
        var result = lobby.join(user2);

        assert.ok(result);
        assert.equal(lobby.users.length, 1);
        assert.deepEqual(lobby.users[0], user2);
        done();
      }, 15);
    });
    it('fails if lobby is closed', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      setTimeout(function() {
        assert.ok(lobby.isClosed);
        var result = lobby.join(user2);

        assert.equal(result, false);
        assert.equal(lobby.users.length, 1);
        assert.deepEqual(lobby.users[0], user1);
        done();
      }, 30);
    });
    it('fails if lobby is at max capacity', function() {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 10,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 1,
        maxUsers: 1,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      var result = lobby.join(user2);

      assert.equal(result, false);
      assert.equal(lobby.users.length, 1);
      assert.deepEqual(lobby.users[0], user1);
    });
    it('adds user when lobby is open and not at max capacity', function() {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var lobby = new Lobby('type', defaultConfig, [user1]);

      var result = lobby.join(user2);

      assert.equal(result, true);
      assert.equal(lobby.users.length, 2);
      assert.deepEqual(lobby.users[0], user1);
      assert.deepEqual(lobby.users[1], user2);
    });
    it('updates ready status to true if number of users is between min and max and starts the check closed ' +
      'status timer when user joins successfully and lobby is not ready', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var user3 = {id: 3, userId: 'three'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 100,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 3,
        maxUsers: 6,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1, user2]);

      lobby.join(user3);

      assert.ok(lobby.isReady);
      setTimeout(function() {
        assert.ok(lobby.isClosed);
        done();
      }, 50);
    });
    it('keeps ready status at false if number of users is not between min and max when user joins successfully and ' +
      'lobby is not ready', function() {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var lobby = new Lobby('type', defaultConfig, [user1]);

      lobby.join(user2);

      assert.equal(lobby.isReady, false);
    });
  });

  describe('leave', function() {
    it('fails if user is not in lobby', function() {
      var user = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig);
      var result;

      result = lobby.leave(user);

      assert.equal(result, false);
    });
    it('fails if user is in lobby but it is closed', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      setTimeout(function() {
        assert.ok(lobby.isClosed);
        var result = lobby.leave(user1);

        assert.equal(result, false);
        done();
      }, 30);
    });
    it('removes user if user is in lobby and it is not closed', function() {
      var user = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig, [user]);
      var result;

      result = lobby.leave(user);

      assert.ok(result);
      assert.equal(lobby.users.length, 0);
    });
    it('updates ready status to false if number of users is not between min and max and stops the check closed ' +
      'status timer when user is removed', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 50,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      setTimeout(function() {
        assert.ok(lobby.isReady);
        var result = lobby.leave(user1);

        assert.equal(lobby.isReady, false);
        done();
      }, 20);
    });
    it('keeps ready status at true if number of users is between min and max when user is removed', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 50,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1, user2]);

      setTimeout(function() {
        assert.ok(lobby.isReady);
        var result = lobby.leave(user1);

        assert.ok(lobby.isReady);
        done();
      }, 20);
    });
  });

  describe('checkIn', function() {
    it('fails if user is not in lobby', function() {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var lobby = new Lobby('type', defaultConfig, [user1]);

      var result = lobby.checkIn(user2);

      assert.equal(result, false);
    });
    it('succeeds if user is in lobby', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 10,
        readyTimeout: 5000,
        checkCurrentUsersInterval: 5,
        checkClosedStatusInterval: 100,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1, user2]);

      setTimeout(function() {
        var result = lobby.checkIn(user2);

        assert.ok(result);
        setTimeout(function() {
          assert.equal(lobby.users.length, 1);
          assert.deepEqual(lobby.users[0], user2);
          done();
        }, 8);
      }, 8);
    });
  });

  describe('acknowledgeLobbyClosure', function() {
    it('fails if lobby is not closed', function() {
      var user = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig, [user]);
      var result;

      result = lobby.acknowledgeLobbyClosure(user);

      assert.equal(result, false);
    });
    it('fails if user is not in lobby', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      setTimeout(function() {
        assert.ok(lobby.isClosed);
        var result = lobby.acknowledgeLobbyClosure(user2);

        assert.equal(result, false);
        done();
      }, 30);
    });
    it('updates user property if user is in lobby and updates can remove status if all users have acknowledged and ' +
      'lobby is ready, closed and not already removable', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1]);

      setTimeout(function() {
        assert.ok(lobby.isClosed);
        var result = lobby.acknowledgeLobbyClosure(user1);

        assert.ok(result);
        setTimeout(function() {
          assert.ok(lobby.canRemove);
          done();
        }, 10);
      }, 30);
    });
    it('updates user property if user is in lobby and does not update can remove status when any user has not ' +
      'acknowledge', function(done) {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var customConfig = {
        userObjectIdentifierProperty: 'id',
        userTimeout: 50,
        readyTimeout: 10,
        checkCurrentUsersInterval: 10,
        checkClosedStatusInterval: 10,
        minUsers: 1,
        maxUsers: 2,
        closedCallback: function() {}
      };
      var lobby = new Lobby('type', customConfig, [user1, user2]);

      setTimeout(function() {
        assert.ok(lobby.isClosed);
        var result = lobby.acknowledgeLobbyClosure(user1);

        assert.ok(result);
        setTimeout(function() {
          assert.equal(lobby.canRemove, false);
          done();
        }, 10);
      }, 30);
    });
  });

  describe('hasUser', function() {
    it('fails if user is not in lobby', function() {
      var user1 = {id: 1, userId: 'one'};
      var user2 = {id: 2, userId: 'two'};
      var lobby = new Lobby('type', defaultConfig, [user1]);

      var result = lobby.hasUser(user2);

      assert.equal(result, false);
    });
    it('succeeds if user is in lobby', function() {
      var user1 = {id: 1, userId: 'one'};
      var lobby = new Lobby('type', defaultConfig, [user1]);

      var result = lobby.hasUser(user1);

      assert.ok(result);
    });
  });
});